from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.recon import get_ip, scan_ports
from core.scanner import check_security_headers, brute_force_directories

app = FastAPI(title="Web Security Checker API")

@app.get("/")
def home():
    return {"message": "Welcome to Security Checker API! Please go to /docs to test the tool."}

# السماح للـ Frontend بالاتصال بالـ API (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # في مرحلة الإنتاج يفضل تحط لينك الدومين بتاعك بدل النجمة
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/scan")
def scan_target(url: str):
    """
    بيستقبل الرابط من الـ Frontend، بيعمل الفحص، ويرجع النتيجة كـ JSON.
    """
    ip = get_ip(url)
    if not ip:
        return {"status": "error", "message": "Could not resolve IP Address."}
    
    ports = scan_ports(ip)
    missing_headers = check_security_headers(url)
    
    # تحديد مستوى الحماية بناءً على النتائج
    if missing_headers:
        status = "danger"
        message = "Vulnerabilities Found!"
    else:
        status = "secure"
        message = "System is Secure."

    return {
        "status": status,
        "message": message,
        "target_url": url,
        "ip_address": ip,
        "open_ports": ports,
        "missing_headers": missing_headers,
        # عشان الـ Brute-force بياخد وقت، ممكن نخليه اختياري أو نرجعه فاضي مؤقتاً للتجربة
        "hidden_directories": [] 
    }
    
# ضيف الدالة دي في آخر ملف api.py
@app.get("/bruteforce")
def brute_force_target(url: str):
    """مسار منفصل للبحث عن الملفات المخفية لتفادي توقف الواجهة"""
    hidden_dirs = brute_force_directories(url)
    return {
        "status": "success",
        "target_url": url,
        "hidden_directories": hidden_dirs
    }