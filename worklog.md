---
Task ID: 1
Agent: Main
Task: Update boutique with new contact info, URL-based images, Ecotrack delivery types, and Instagram photos

Work Log:
- Explored full codebase structure and read all key files
- Updated boutique name from "Boutique Robes Kabyles" to "Robe Kabyle Kenza" across 7 files (Navbar, Footer, Homepage, Layout, Admin Login, POS Layout, POS Page)
- Updated address to "Rue de la Victoire, Aïn Taya, Alger Plage, Algérie"
- Updated phone to "0561 34 27 62"
- Added Instagram link: https://www.instagram.com/robe_kabyle_kenza/
- Changed mobile abbreviation from "BRK" to "RKK"
- Replaced image upload with URL input in admin products page (removed file upload, added URL text input with validation)
- Updated Ecotrack integration with home delivery and stop desk pricing (58 wilayas with rates)
- Added delivery type selector (home vs stop desk) to order form
- Updated next.config.ts to allow Instagram/Facebook CDN images
- Generated 4 AI product images for Kabyle dresses
- Build verified successful, all pages returning 200 OK

Stage Summary:
- Boutique rebranded to "Robe Kabyle Kenza" with correct contact info
- Admin products now use URL input instead of file upload (supports Instagram URLs)
- Order form includes delivery type selector (Livraison à domicile vs Stop Desk)
- Shipping rates available for all 58 wilayas (home + stop desk pricing)
- Instagram page inaccessible for scraping (JS-rendered), generated AI product photos instead
