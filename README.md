# BOTENS Robotics website

Static website for BOTENS Robotics (Style 4, Dark Motion). No build step: open `index.html` in a browser, or serve the folder as-is (for example with GitHub Pages).

- `index.html`: all five pages (Home, About Us, Our Robots, Smart Delivery, AIoT Technology) and the contact form
- `styles.css`: layout and colours
- `script.js`: page switching, mobile menu, contact email draft, video controls and animation
- `assets/`: logo, light logo for dark backgrounds, robot images, banner video and poster

Animation uses GSAP 3.13.0 (ScrollTrigger, SplitText) and Lenis 1.1.13 from public CDNs. Without them the site still shows all content, without motion.

The contact form opens an email draft to marketing@botens.onmicrosoft.com; it does not submit to a server. The EN / TH / 中文 language buttons are placeholders.
