import requests

try:
    res = requests.post("http://api.madrabbit.cf", timeout=3)
    print("Host:\tapi.madrabbit.cf\t可用")
except:
    print("Host:\tapi.madrabbit.cf\t不可用")

try:
    res = requests.post("http://45.88.194.149:1804", timeout=3)
    print("Host:\t45.88.194.149:1804\t可用")
except Exception as e:
    print("Host:\t45.88.194.149:1804\t不可用")

try:
    res = requests.post("http://62.204.54.137:1804", timeout=3)
    print("Host:\t62.204.54.137:1804\t可用")
except Exception as e:
    print("Host:\t62.204.54.137:1804\t不可用")
