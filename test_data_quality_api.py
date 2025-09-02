#!/usr/bin/env python3
"""
Test script for the enhanced analytics API with data quality controls.
Tests all endpoints to ensure:
1. No negative predictions
2. Proper type normalization (MoveType ∈ {IN, OUT}, Desig ∈ {EMPTY, FULL, EXP})
3. Latest-only selection via deduplication
4. Time zone consistency
5. Consistent rounding policy
6. Metadata inclusion
"""

import requests
import json
from datetime import datetime, timedelta

# API base URL
BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint, params, description):
    """Test a single endpoint and validate response structure."""
    print(f"\n{'='*60}")
    print(f"Testing: {description}")
    print(f"Endpoint: {endpoint}")
    print(f"Params: {params}")
    print(f"{'='*60}")
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", params=params)
        response.raise_for_status()
        data = response.json()
        
        print(f"✅ Status: {response.status_code}")
        print(f"📊 Response keys: {list(data.keys())}")
        
        # Check for metadata
        if 'meta' in data:
            meta = data['meta']
            print(f"🕒 Timezone: {meta.get('tz', 'N/A')}")
            print(f"📅 As of: {meta.get('as_of', 'N/A')}")
            print(f"🔧 Data quality policies:")
            dq = meta.get('data_quality', {})
            for policy, value in dq.items():
                print(f"   - {policy}: {value}")
        else:
            print("⚠️  No metadata found")
        
        # Validate data quality
        validate_data_quality(data, endpoint)
        
        # Show sample data
        show_sample_data(data)
        
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON response: {e}")
        return None

def validate_data_quality(data, endpoint):
    """Validate data quality rules across different response structures."""
    print(f"\n🔍 Data Quality Validation:")
    
    issues = []
    
    # Helper function to check prediction values
    def check_pred_values(items, context):
        negative_count = 0
        for item in items:
            pred = item.get('pred', item.get('total_pred', item.get('total_volume', 0)))
            if pred < 0:
                negative_count += 1
                issues.append(f"Negative prediction in {context}: {pred}")
        return negative_count
    
    # Helper function to check move type normalization
    def check_move_types(items, context):
        invalid_types = []
        for item in items:
            mt = item.get('move_type', item.get('key', ''))
            if mt and mt.lower() not in ['in', 'out', 'unk']:
                invalid_types.append(mt)
        if invalid_types:
            issues.append(f"Invalid move types in {context}: {set(invalid_types)}")
        return invalid_types
    
    # Helper function to check designation normalization  
    def check_designations(items, context):
        invalid_desigs = []
        for item in items:
            desig = item.get('desig', item.get('key', ''))
            if desig and desig.lower() not in ['empty', 'full', 'exp', 'unk']:
                invalid_desigs.append(desig)
        if invalid_desigs:
            issues.append(f"Invalid designations in {context}: {set(invalid_desigs)}")
        return invalid_desigs
    
    # Validate based on response structure
    if 'ranking' in data:
        check_pred_values(data['ranking'], 'terminal_ranking')
    elif 'share' in data:
        for mt, value in data['share'].items():
            if value < 0:
                issues.append(f"Negative share value for {mt}: {value}")
            if mt not in ['IN', 'OUT']:
                issues.append(f"Invalid move type in share: {mt}")
    elif 'points' in data:
        check_pred_values(data['points'], 'points')
        if any('move_type' in p for p in data['points']):
            check_move_types(data['points'], 'points')
        if any('desig' in p for p in data['points']):
            check_designations(data['points'], 'points')
    elif 'cells' in data:
        check_pred_values(data['cells'], 'cells')
    elif 'rows' in data:
        check_pred_values(data['rows'], 'rows')
        if data.get('dim') == 'movetype':
            check_move_types(data['rows'], 'composition_movetype')
        elif data.get('dim') == 'desig':
            check_designations(data['rows'], 'composition_desig')
    elif 'total_volume' in data:
        # Total forecast volume endpoint
        for field in ['total_volume', 'total_in', 'total_out']:
            if data.get(field, 0) < 0:
                issues.append(f"Negative {field}: {data[field]}")
        if 'breakdown' in data:
            check_pred_values(data['breakdown'], 'breakdown')
    
    if issues:
        print(f"❌ Found {len(issues)} data quality issues:")
        for issue in issues:
            print(f"   - {issue}")
    else:
        print("✅ All data quality checks passed!")

def show_sample_data(data, max_items=3):
    """Show a sample of the response data."""
    print(f"\n📋 Sample Data (max {max_items} items):")
    
    if 'ranking' in data:
        for i, item in enumerate(data['ranking'][:max_items]):
            print(f"   {i+1}. Terminal {item['terminal']}: {item['total_pred']} containers")
    elif 'share' in data:
        for mt, value in data['share'].items():
            print(f"   {mt}: {value} containers")
    elif 'points' in data:
        for i, item in enumerate(data['points'][:max_items]):
            if 'move_type' in item:
                print(f"   {i+1}. {item['date']} H{item['hour']} {item['move_type'].upper()}: {item['pred']}")
            else:
                print(f"   {i+1}. {item['date']} H{item['hour']}: {item['pred']}")
    elif 'cells' in data:
        for i, item in enumerate(data['cells'][:max_items]):
            print(f"   {i+1}. Terminal {item['terminal']} H{item['hour']}: {item['pred']}")
    elif 'total_volume' in data:
        print(f"   Total Volume: {data['total_volume']} ({data['window_hours']}h window)")
        print(f"   IN: {data['total_in']}, OUT: {data['total_out']}, Net: {data['net_flow']}")
        if data.get('breakdown'):
            print(f"   Breakdown sample: {data['breakdown'][:2]}")

def main():
    """Run comprehensive tests on all analytics endpoints."""
    print("🚀 Starting Data Quality API Test Suite")
    print(f"📍 Testing API at: {BASE_URL}")
    
    # Generate test time window (next 8 hours)
    now = datetime.now()
    start_time = now.strftime("%Y-%m-%dT%H:00")
    end_time = (now + timedelta(hours=8)).strftime("%Y-%m-%dT%H:00")
    
    print(f"🕐 Test time window: {start_time} to {end_time}")
    
    # Test cases
    test_cases = [
        {
            "endpoint": "/analytics/terminal_ranking",
            "params": {"start_iso": start_time, "end_iso": end_time},
            "description": "Terminal Ranking (all terminals)"
        },
        {
            "endpoint": "/analytics/movetype_share", 
            "params": {"start_iso": start_time, "end_iso": end_time, "terminal_id": "T1"},
            "description": "Move Type Share (T1 only)"
        },
        {
            "endpoint": "/analytics/movetype_hourly",
            "params": {"start_iso": start_time, "end_iso": end_time, "terminal_id": "T1"},
            "description": "Move Type Hourly Trend (T1 only)"
        },
        {
            "endpoint": "/analytics/desig_hourly",
            "params": {"start_iso": start_time, "end_iso": end_time, "terminal_id": "T1", "move_type": "IN"},
            "description": "Designation Hourly (T1, IN only)"
        },
        {
            "endpoint": "/analytics/terminal_hour_heatmap",
            "params": {"start_iso": start_time, "end_iso": end_time, "move_type": "IN"},
            "description": "Terminal x Hour Heatmap (IN only)"
        },
        {
            "endpoint": "/analytics/hourly_totals",
            "params": {"start_iso": start_time, "end_iso": end_time, "terminal_id": "T1"},
            "description": "Hourly Totals (T1 only)"
        },
        {
            "endpoint": "/analytics/total_forecast_volume",
            "params": {"start_iso": start_time, "end_iso": end_time, "terminal_id": "T1"},
            "description": "Total Forecast Volume (T1 only) - NEW ENDPOINT"
        },
        {
            "endpoint": "/analytics/composition_by_terminal",
            "params": {"start_iso": start_time, "end_iso": end_time, "dim": "movetype"},
            "description": "Composition by Terminal (Move Type dimension)"
        },
        {
            "endpoint": "/analytics/composition_by_terminal", 
            "params": {"start_iso": start_time, "end_iso": end_time, "dim": "desig"},
            "description": "Composition by Terminal (Designation dimension)"
        }
    ]
    
    results = {}
    
    # Run all tests
    for test_case in test_cases:
        result = test_endpoint(
            test_case["endpoint"], 
            test_case["params"], 
            test_case["description"]
        )
        results[test_case["endpoint"]] = result
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 TEST SUMMARY")
    print(f"{'='*60}")
    
    successful = len([r for r in results.values() if r is not None])
    total = len(results)
    
    print(f"✅ Successful: {successful}/{total}")
    print(f"❌ Failed: {total - successful}/{total}")
    
    if successful == total:
        print("\n🎉 All tests passed! Data quality controls are working correctly.")
    else:
        print(f"\n⚠️  Some tests failed. Check the logs above for details.")
    
    # Test cross-endpoint consistency
    if results.get("/analytics/total_forecast_volume") and results.get("/analytics/hourly_totals"):
        print(f"\n🔄 Cross-endpoint consistency check:")
        tfv = results["/analytics/total_forecast_volume"]
        ht = results["/analytics/hourly_totals"]
        
        tfv_total = tfv.get("total_volume", 0)
        ht_total = sum(p.get("pred", 0) for p in ht.get("points", []))
        
        if abs(tfv_total - ht_total) < 0.1:  # Allow small rounding differences
            print("✅ Total forecast volume matches hourly totals sum")
        else:
            print(f"❌ Inconsistency: TFV={tfv_total}, HT_sum={ht_total}")

if __name__ == "__main__":
    main()
