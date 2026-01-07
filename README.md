# Image Compare Tool

A powerful, premium web-based tool for comparing matching images across multiple folders side-by-side. 
Built with **Vite** and **Vanilla JS**, featuring a modern Glassmorphic UI and synchronized interaction controls.

## 🚀 Key Features

### 📂 Smart Comparison
- **Multi-Folder Selection**: Select a parent directory or multiple source folders. The tool automatically groups images by their filenames.
- **Missing Match Detection**: Instantly see how many matches exist for each filename.
- **Clean UI**: Displays only the **Folder Name** below each image for easy identification.

### 🔍 Synchronized Zoom & Pan (New!)
Interact with one image, and **all** corresponding images follow instantly.
- **Smooth Zoom**: Use your mouse wheel or pinch gesture to zoom in/out with buttery-smooth precision.
- **Pan Anywhere**: Click and drag to move all images simultaneously (native drag ghosting disabled).
- **Double-Click Reset**: Quickly return an image to its original size.
- **Navigation Persistence**: Your zoom level and pan position stay **locked** even when you switch to the next image (Next/Prev).

### 🎛️ Flexible View Modes
- **Single Match Focus**: Compare one filename at a time in full detail.
- **List View**: Scroll through all matched groups at once.
- **Custom Grid Layouts**: Choose from **Auto**, **1x1**, **2x2**, **3x3**, **4x4**, **6x6**, or **8x8** grids to fit your screen.
- **Smart 7-Item Grid**: The 4x4 layout automatically arranges 7 images as **4 on top and 3 below**.

### ⌨️ Navigation
- **Arrow Keys**: Use `Left` and `Right` arrow keys to cycle through matched filenames.
- **On-Screen Controls**: Dedicated **Previous** and **Next** buttons in the header.

## 🛠️ Tech Stack
- **Framework**: Vite + Vanilla JavaScript
- **Styling**: Pure CSS (Variables, Flexbox, Grid) with Glassmorphism design
- **Performance**: Optimized rendering with `requestAnimationFrame` for zoom comparisons

## 🏃‍♂️ How to Run

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open the link shown (usually `http://localhost:5173`).

3. **Build for Production**
   ```bash
   npm run build
   ```