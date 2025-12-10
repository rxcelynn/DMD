document.addEventListener("DOMContentLoaded", function () {
    const appNav = document.getElementById('app-nav');
    const menuToggle = document.getElementById('menu-toggle');
    const appContent = document.querySelector('.app-content');
    const appFooter = document.querySelector('.footer');

    // Helper function to toggle the classes
    const toggleMenu = () => {
        appNav.classList.toggle('nav-open');
        appContent.classList.toggle('blur-content');
        appFooter.classList.toggle('blur-content');
    };

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }
    
    if (appContent) {
        appContent.addEventListener('click', (event) => {
            if (appNav.classList.contains('nav-open') && event.currentTarget.classList.contains('blur-content')) {
                toggleMenu();
            }
        });
    }
    

    if (appFooter) {
        appFooter.addEventListener('click', (event) => {
            if (appNav.classList.contains('nav-open') && event.currentTarget.classList.contains('blur-content')) {
                toggleMenu();
            }
        });
    }
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
    document.body.classList.add("dark"); 
    document.documentElement.classList.add("dark"); 
    }
});