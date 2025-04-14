/*function navigate(page) {
    window.location.href = page;
}*/

/*const background = document.querySelector('.backgroundBoxes');
        let X = 0;
        let Y = 0;
        let x = 0;
        let y = 0;

        // Track mouse movements
        document.querySelector("body").addEventListener("mousemove", eyeball);

        document.addEventListener('mousemove', (event) => {
            x = event.clientX; // X-coordinate of the cursor
            y = event.clientY; // Y-coordinate of the cursor
        });

        function UpdatePosition(){
            X+= (x-X)*0.1;
            Y+= (y-Y)*0.1;

            console.log(X);

            // Update the mask position to follow the cursor
            background.style.maskImage = `radial-gradient(circle 150px at ${X}px ${Y}px, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0.6) 60%, rgba(0, 0, 0, 0) 80%)`;
            background.style.webkitMaskPosition = `radial-gradient(circle 150px at ${X}px ${Y}px, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0.6) 60%, rgba(0, 0, 0, 0) 80%)`; // For Safari

            requestAnimationFrame(UpdatePosition);
        }
            
        UpdatePosition();*/

        const background = document.querySelector('.backgroundBoxes');

        let X = 0, Y = 0;  // Smoothed position
        let x = 0, y = 0;  // Raw mouse position
        
        // Track mouse movements
        document.addEventListener('mousemove', (event) => {
            x = event.clientX;
            y = event.clientY;
        });
        
        function updatePosition() {
            // Apply a smooth transition effect
            X += (x - X) * 0.1;
            Y += (y - Y) * 0.1;
        
            // Apply the mask dynamically
            const maskStyle = `radial-gradient(circle 150px at ${X}px ${Y}px, 
                             rgba(0, 0, 0, 1) 40%, 
                             rgba(0, 0, 0, 0.6) 60%, 
                             rgba(0, 0, 0, 0) 80%)`;
        
            background.style.maskImage = maskStyle;
            background.style.webkitMaskImage = maskStyle; // Safari support
        
            requestAnimationFrame(updatePosition);  // Continuously update
        }
        
        // Start the animation loop
        updatePosition();
        
