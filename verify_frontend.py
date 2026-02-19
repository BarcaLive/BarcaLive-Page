from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to homepage...")
            page.goto("http://localhost:8080/index.html")

            # Wait for data to load (since it fetches API)
            print("Waiting for network idle...")
            page.wait_for_load_state("networkidle")

            # Additional wait for rendering
            time.sleep(2)

            print("Taking screenshot...")
            page.screenshot(path="verification_screenshot.png", full_page=True)
            print("Screenshot saved to verification_screenshot.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
