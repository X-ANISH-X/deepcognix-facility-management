import requests
import datetime
import sys

BASE = 'http://127.0.0.1:8000'

admin = {'email': 'sam@gmail.com', 'password': 'test123'}
user = {'email': 'sam234@gmail.com', 'password': 'test123'}
tech = {'email': 'sam123@gmail.com', 'password': 'test123'}

s_user = requests.Session()
print('Logging in as user...')
r = s_user.post(f'{BASE}/auth/login', json=user)
print('user login status', r.status_code, r.text)
if r.status_code != 200:
    sys.exit(1)
user_token = r.json().get('access_token')
s_user.headers.update({'Authorization': f'Bearer {user_token}'})

# pick a service and package
print('Fetching services...')
services = requests.get(f'{BASE}/services/').json()
print('services count', len(services))
service_id = services[0]['id']

print('Fetching packages...')
packages = requests.get(f'{BASE}/packages/').json()
print('packages count', len(packages))
package_id = packages[0]['id']

# create booking
payload = {
    'service_id': service_id,
    'package_id': package_id,
    'scheduled_date': datetime.date.today().isoformat(),
    'scheduled_time_slot': '09:00 AM',
    'address_line': 'E2E Test Address',
    'building_name': 'E2E Tower',
    'floor_number': '1',
    'apartment_number': '101',
    'latitude': 12.34,
    'longitude': 56.78,
    'customer_notes': 'Created by e2e script',
}
print('Creating booking as user...')
r = s_user.post(f'{BASE}/bookings/', json=payload)
print('create booking status', r.status_code, r.text)
if r.status_code not in (200,201):
    sys.exit(1)
booking_id = r.json().get('booking_id')
print('booking id', booking_id)

# Admin login and list bookings
s_admin = requests.Session()
print('Logging in as admin...')
r = s_admin.post(f'{BASE}/auth/login', json=admin)
print('admin login status', r.status_code, r.text)
if r.status_code != 200:
    sys.exit(1)
admin_token = r.json().get('access_token')
s_admin.headers.update({'Authorization': f'Bearer {admin_token}'})

print('Admin listing bookings...')
r = s_admin.get(f'{BASE}/bookings/')
print('list bookings status', r.status_code)
bookings = r.json()
print('bookings count for admin', len(bookings))
found = any(b.get('id') == booking_id for b in bookings)
print('admin sees booking:', found)

# Admin get technicians and assign
print('Admin fetching users(role=technician)...')
r = s_admin.get(f'{BASE}/auth/users?role=technician')
print('users status', r.status_code)
techs = r.json()
print('tech count', len(techs))
if not techs:
    print('No technicians found')
    sys.exit(1)
tech_id = techs[0]['id']
print('Assigning booking to technician', tech_id)
r = s_admin.post(f'{BASE}/bookings/{booking_id}/assign', json={'technician_id': tech_id})
print('assign status', r.status_code, r.text)

# Technician login and list bookings
s_tech = requests.Session()
r = s_tech.post(f'{BASE}/auth/login', json=tech)
print('tech login status', r.status_code)
if r.status_code != 200:
    print(r.text); sys.exit(1)
tech_token = r.json().get('access_token')
s_tech.headers.update({'Authorization': f'Bearer {tech_token}'})

print('Technician listing bookings...')
r = s_tech.get(f'{BASE}/bookings/')
print('tech bookings status', r.status_code)
tech_bookings = r.json()
print('technician sees booking present:', any(b.get('id') == booking_id for b in tech_bookings))

# Technician starts job
print('Technician starting job...')
r = s_tech.post(f'{BASE}/bookings/{booking_id}/start')
print('start status', r.status_code, r.text)

print('\nE2E test complete')
