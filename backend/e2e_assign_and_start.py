import requests
import sys

BASE = 'http://127.0.0.1:8000'
admin = {'email': 'sam@gmail.com', 'password': 'test123'}
tech_email = 'sam123@gmail.com'
booking_id = 15

s_admin = requests.Session()
print('Admin login...')
r = s_admin.post(f'{BASE}/auth/login', json=admin)
print('admin login status', r.status_code)
if r.status_code != 200:
    print(r.text); sys.exit(1)
admin_token = r.json().get('access_token')
s_admin.headers.update({'Authorization': f'Bearer {admin_token}'})

print('Fetching technicians...')
r = s_admin.get(f'{BASE}/auth/users?role=technician')
if r.status_code != 200:
    print('Failed to fetch techs', r.status_code, r.text); sys.exit(1)
techs = r.json()
print('Technicians:', techs)

tech_id = None
for t in techs:
    if t.get('email') == tech_email:
        tech_id = t.get('id')
        break

if not tech_id:
    print('Could not find technician with email', tech_email); sys.exit(1)

print('Assigning booking', booking_id, 'to tech id', tech_id)
r = s_admin.post(f'{BASE}/bookings/{booking_id}/assign', json={'technician_id': tech_id})
print('assign status', r.status_code, r.text)

# Technician login
s_tech = requests.Session()
print('Tech login...')
r = s_tech.post(f'{BASE}/auth/login', json={'email': tech_email, 'password': 'test123'})
print('tech login status', r.status_code)
if r.status_code != 200:
    print(r.text); sys.exit(1)
tech_token = r.json().get('access_token')
s_tech.headers.update({'Authorization': f'Bearer {tech_token}'})

print('Tech listing bookings...')
r = s_tech.get(f'{BASE}/bookings/')
print('tech bookings status', r.status_code)
print('bookings:', r.json())
print('Does tech see booking?', any(b.get('id') == booking_id for b in r.json()))

print('Tech starting job...')
r = s_tech.post(f'{BASE}/bookings/{booking_id}/start')
print('start status', r.status_code, r.text)
