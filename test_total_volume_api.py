#!/usr/bin/env python3
"""
Test script for the new /analytics/total_forecast_volume API endpoint.

This script tests the endpoint in isolation to debug any issues before
integrating it into the frontend.
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Configuration
BASE_URL = "http://localhost:8000"
ENDPOINT = "/analytics/total_forecast_volume"

def test_total_forecast_volume_api():
    """Test the total forecast volume endpoint with various scenarios."""
    
    print("=== Testing Total Forecast Volume API ===\n")
    
    # Test case 1: Next 8 hours (default scenario)
    print("Test 1: Next 8 hours from now")
    now = datetime.now()
    start_iso = now.strftime("%Y-%m-%dT%H:00")
    end_iso = (now + timedelta(hours=8)).strftime("%Y-%m-%dT%H:00")
    
    params = {
        "start_iso": start_iso,
        "end_iso": end_iso,
        "terminal_id": "T1"
    }
    
    try:
        response = requests.get(f"{BASE_URL}{ENDPOINT}", params=params)
        print(f"URL: {response.url}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response:")
            print(json.dumps(data, indent=2))
            
            # Validate the response structure
            required_fields = ["total_volume", "total_in", "total_out", "net_flow", "window_hours", "breakdown"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ Missing required fields: {missing_fields}")
            else:
                print("✅ Response structure is valid")
                
                # Validate calculations
                total_volume = data["total_volume"]
                total_in = data["total_in"]
                total_out = data["total_out"]
                net_flow = data["net_flow"]
                
                calculated_total = total_in + total_out
                calculated_net = total_in - total_out
                
                print(f"\nValidation:")
                print(f"Total volume: {total_volume} (calculated: {calculated_total:.1f})")
                print(f"Net flow: {net_flow} (calculated: {calculated_net:.1f})")
                
                if abs(total_volume - calculated_total) < 0.1:
                    print("✅ Total volume calculation is correct")
                else:
                    print("❌ Total volume calculation mismatch")
                
                if abs(net_flow - calculated_net) < 0.1:
                    print("✅ Net flow calculation is correct")
                else:
                    print("❌ Net flow calculation mismatch")
                
                # Validate breakdown
                breakdown_total = sum(h["total"] for h in data["breakdown"])
                print(f"Breakdown sum: {breakdown_total:.1f}")
                
                if abs(breakdown_total - total_volume) < 0.1:
                    print("✅ Breakdown matches total volume")
                else:
                    print("❌ Breakdown does not match total volume")
                    
        else:
            print(f"❌ Error response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test case 2: All terminals
    print("Test 2: All terminals (no filter)")
    params["terminal_id"] = "ALL"
    
    try:
        response = requests.get(f"{BASE_URL}{ENDPOINT}", params=params)
        print(f"URL: {response.url}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total volume (all terminals): {data['total_volume']}")
            print(f"IN: {data['total_in']}, OUT: {data['total_out']}, Net: {data['net_flow']}")
            print(f"Hours in breakdown: {len(data['breakdown'])}")
            print("✅ All terminals test passed")
        else:
            print(f"❌ Error response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test case 3: Filtered by move type
    print("Test 3: Filtered by move type (IN only)")
    params["move_type"] = "IN"
    
    try:
        response = requests.get(f"{BASE_URL}{ENDPOINT}", params=params)
        print(f"URL: {response.url}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total volume (IN only): {data['total_volume']}")
            print(f"IN: {data['total_in']}, OUT: {data['total_out']}")
            
            # Should have zero OUT when filtered to IN only
            if data['total_out'] == 0:
                print("✅ Move type filter working correctly")
            else:
                print("❌ Move type filter not working - should have zero OUT")
        else:
            print(f"❌ Error response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test case 4: Custom time range (today)
    print("Test 4: Custom time range (today)")
    today = datetime.now()
    start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = today.replace(hour=23, minute=0, second=0, microsecond=0)
    
    params = {
        "start_iso": start_of_day.strftime("%Y-%m-%dT%H:00"),
        "end_iso": end_of_day.strftime("%Y-%m-%dT%H:00"),
        "terminal_id": "T1"
    }
    
    try:
        response = requests.get(f"{BASE_URL}{ENDPOINT}", params=params)
        print(f"URL: {response.url}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Total volume (today): {data['total_volume']}")
            print(f"Window hours: {data['window_hours']}")
            print(f"Hours in breakdown: {len(data['breakdown'])}")
            
            expected_hours = 23  # 0-22 hours
            if data['window_hours'] == expected_hours:
                print("✅ Window hours calculation correct for today")
            else:
                print(f"❌ Window hours mismatch - expected {expected_hours}, got {data['window_hours']}")
        else:
            print(f"❌ Error response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_api_availability():
    """Test if the API server is running and the endpoint exists."""
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ API server is running")
        else:
            print("❌ API server may not be running or accessible")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to API server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Starting API test...")
    
    if test_api_availability():
        test_total_forecast_volume_api()
    else:
        print("Cannot proceed with tests - API server not available")
        sys.exit(1)
    
    print("Test completed!")
