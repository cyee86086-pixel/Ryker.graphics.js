# Ryker.graphics.js

Ryker.graphics.js is a powerful graphics library designed for creating and rendering graphics in web applications.

## Installation

You can easily include the library in your project by adding the following CDN link to your HTML file:

```html
<script src="https://cdn.jsdelivr.net/gh/cyee86086-pixel/Ryker.graphics.js@latest/dist/ryker.graphics.min.js"></script>
```

## Usage Examples

### Rendering with the Renderer Class

To use the Renderer class, you first need to instantiate it and then use it to render shapes and graphics. Here is a basic example:

```javascript
// Create a new renderer instance
const canvas = document.getElementById('myCanvas');
const renderer = new Renderer(canvas);

// Set the background color
renderer.setBackgroundColor('#FFFFFF');

// Draw a rectangle
renderer.drawRect(10, 10, 100, 50, { fillStyle: '#FF0000' });

// Draw a circle
renderer.drawCircle(150, 75, 40, { fillStyle: '#00FF00' });
```

### Supported Features
- Drawing shapes (rectangles, circles, lines)
- Animations for dynamic rendering
- Layering of graphics
- Easy color management
- Canvas resizing and scaling

For more detailed documentation and advanced usage, check the [official documentation](https://github.com/cyee86086-pixel/Ryker.graphics.js) repository.