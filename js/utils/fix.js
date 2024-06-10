"use strict";

function zoom() {
    const image = document.querySelector(".dark-overlay img");
    let scale = 1;
    const SCALE_FACTOR = 0.1;

    image.addEventListener("mousewheel", function (e) {
        e.preventDefault();
    // @ts-ignore
        scale += e.deltaY > 0 ? -SCALE_FACTOR : SCALE_FACTOR;
        scale = Math.min(Math.max(1, scale), 6);
        this.style.transform = `scale(${scale})`;
    });
    image.addEventListener('mousemove', function (e) {
        e.preventDefault();
        const { left, top, width, height } = this.getBoundingClientRect();
    // @ts-ignore
        const x = (e.clientX - left) / width * 100;
    // @ts-ignore
        const y = (e.clientY - top) / height * 100;
        this.style.transformOrigin = `${x}% ${y}%`;
    });

    image.addEventListener('mouseout', function (e) {
        e.preventDefault();
        this.style.transformOrigin = 'unset';
        this.style.transform = 'scale(1)'
    });
}