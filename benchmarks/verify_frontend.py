from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to http://localhost:8080/index.html")
        page.goto("http://localhost:8080/index.html")

        # Wait for some content to load.
        # The app might take a moment to fetch data.
        # We can wait for .glass-premium which seems to be used in cards.
        try:
            page.wait_for_selector(".glass-premium", timeout=10000)
            print("Content loaded.")
        except:
            print("Timeout waiting for content, taking screenshot anyway.")

        # Wait a bit more for images to potentially load
        time.sleep(2)

        screenshot_path = "frontend_verification.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run()
