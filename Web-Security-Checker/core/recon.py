import socket
import concurrent.futures
from urllib.parse import urlparse
from colorama import Fore

def get_ip(url):
    try:
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        if not domain:
            domain = parsed_url.path 
            
        ip = socket.gethostbyname(domain)
        return ip
        
    except socket.gaierror:
        return None
    except Exception as e:
        print(Fore.RED + f"[-] An error occurred while resolving IP: {e}")
        return None

def check_single_port(ip, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(3.0) 
    try:
        result = sock.connect_ex((ip, port))
        if result == 0:
            banner = "Open"
            try: 
                # محاولة سحب البانر لمعرفة نوع السيرفر
                if port in [80, 443]:
                    sock.sendall(b"HEAD / HTTP/1.1\r\nHost: " + ip.encode() + b"\r\n\r\n")
                # قراءة أول سطر من رد السيرفر
                banner_data = sock.recv(1024).decode('utf-8', errors='ignore').split('\n')[0]
                if banner_data: 
                    banner = banner_data.strip()
            except:
                pass
            return f"{port} ({banner})" # هيرجع البورت وجنبه حالة السيرفر
        return None
    except:
        return None
    finally:
        sock.close()

def scan_ports(ip):
    common_ports = [21, 22, 23, 25, 53, 80, 110, 443, 3306, 3389]
    open_ports = []

    print(Fore.BLUE + "[*] Starting fast port scan on common ports...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(check_single_port, ip, port): port for port in common_ports}
        for future in concurrent.futures.as_completed(futures):
            port = future.result()
            if port:
                open_ports.append(port)
                
    return sorted(open_ports)