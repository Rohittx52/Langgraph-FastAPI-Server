# test_run.py
import requests, time

BASE = "http://127.0.0.1:8000/api"
r = requests.post(BASE + "/runs/", json={"name":"smoke","payload":{"input":"hi"}})
rid = r.json()["run_id"]
print("run_id:", rid)

for i in range(30):
    j = requests.get(BASE + f"/runs/{rid}")
    print(i, j.status_code, j.text)
    if j.status_code==200 and ("completed" in j.text or "cancelled" in j.text or "failed" in j.text):
        break
    time.sleep(1)
