import requests
import os
import concurrent.futures
from colorama import Fore

def check_security_headers(url):
    print(Fore.BLUE + "\n[*] Checking HTTP Security Headers...")
    
    headers_to_check = [
        "Strict-Transport-Security", 
        "X-Frame-Options",           
        "X-Content-Type-Options",    
        "Content-Security-Policy",   
        "X-XSS-Protection"           
    ]
    missing_headers = []
    
    try:
        response = requests.get(url, timeout=5)
        server_headers = response.headers
        
        for header in headers_to_check:
            if header.lower() not in (h.lower() for h in server_headers):
                missing_headers.append(header)
        
        if missing_headers:
            print(Fore.RED + "[-] Vulnerability Found: Missing Security Headers!")
            for h in missing_headers:
                print(Fore.RED + f"    [!] Missing: {h}")
        else:
            print(Fore.GREEN + "[+] All basic security headers are present. Good job!")
            
        return missing_headers
        
    except requests.RequestException as e:
        print(Fore.RED + f"[-] Failed to connect to the website for header checking: {e}")
        return None

def brute_force_directories(url):
    print(Fore.BLUE + "\n[*] Starting Directory Brute-forcing...")
    
    wordlist_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'common_dirs.txt')
    found_dirs = []
    
    if not os.path.exists(wordlist_path):
        print(Fore.RED + "[-] Wordlist not found at: data/common_dirs.txt")
        return found_dirs

    with open(wordlist_path, 'r') as file:
        directories = [line.strip() for line in file if line.strip()]

    print(Fore.BLUE + f"[*] Loaded {len(directories)} paths to test.")

    def check_url(directory):
        target = f"{url.rstrip('/')}/{directory}"
        try:
            response = requests.get(target, timeout=3)
            if response.status_code == 200:
                return target
            return None
        except requests.RequestException:
            return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(check_url, directory): directory for directory in directories}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                found_dirs.append(result)
                print(Fore.GREEN + f"    [+] Found: {result}")

    if not found_dirs:
        print(Fore.YELLOW + "[-] No hidden directories found from the basic list.")
        
    return found_dirs