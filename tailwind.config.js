/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}"],
  safelist: [
      'child-checkbox',
      'label-ExtraBed',
      'img-container',
      'title',
      'message',
      'amenities-list',
      'amenity-item',
      'age-input',
      'child-container',
      'room-name',
      'room-price'
  ],
  theme: {
    extend: {
      colors: {
        'litepicker-is-today': '#2196f3',
        'litepicker-is-locked': '#d3d3d3',
        'litepicker-header': '#333',
        'litepicker-button-disabled': '#9e9e9e',

        disabled: '#9e9e9e',
        background: '#7DB0C8',
        'light-background': '#f9f9f9',
        overflow: 'rgba(0, 0, 0, 0.5)',
        elements: '#0697BA',
        'hover-elements': '#699ED8',
        white: '#fff',
        'color-border': '#333'
      },
    },
  },
  plugins: [],
}

