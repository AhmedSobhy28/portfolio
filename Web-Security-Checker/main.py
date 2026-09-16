import argparse
import sys
from colorama import init, Fore, Style
from core.recon import get_ip, scan_ports
from core.scanner import check_security_headers, brute_force_directories

# تفعيل المكتبة عشان الألوان ترجع لطبيعتها بعد كل سطر (مهم جداً)
init(autoreset=True)

def print_banner():
    print(Fore.CYAN + Style.BRIGHT + "="*50)
    print(Fore.CYAN + Style.BRIGHT + "     WEBSITE SECURITY CHECKER - BY AHMED SOBHY")
    print(Fore.CYAN + Style.BRIGHT + "="*50)

def main():
    parser = argparse.ArgumentParser(description="Automated Website Security Scanner")
    parser.add_argument("-u", "--url", required=True, help="Target URL (e.g., http://example.com)")
    
    args = parser.parse_args()
    target_url = args.url

    print_banner()
    print(Fore.BLUE + f"[*] Starting scan for: {target_url}\n")

    ip_address = get_ip(target_url)
    
    if ip_address:
        print(Fore.GREEN + f"[+] Target IP Address: {ip_address}")
        
        open_ports = scan_ports(ip_address)
        
        if open_ports:
            print(Fore.GREEN + f"[+] Open Ports Found: {open_ports}")
        else:
            print(Fore.YELLOW + "[-] No common open ports found (Server might be filtering traffic).")
            
        check_security_headers(target_url)
        
        brute_force_directories(target_url)
            
    else:
        print(Fore.RED + "[-] Could not resolve IP Address. Please check the URL.")
        sys.exit(1)

if __name__ == "__main__":
    main()