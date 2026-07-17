/** localStorage key for the admin console theme preference. */
export const ADMIN_THEME_STORAGE_KEY = "admin-theme";

/**
 * Inline script (no defer/module) that runs before paint on /admin routes only.
 * Keeps the public site light while avoiding a flash when the admin prefers dark.
 */
export const ADMIN_THEME_INIT_SCRIPT = `(function(){try{if(!location.pathname.startsWith("/admin"))return;var t=localStorage.getItem(${JSON.stringify(ADMIN_THEME_STORAGE_KEY)});var dark=t==="dark"||((t==="system"||t==null)&&matchMedia("(prefers-color-scheme: dark)").matches);if(dark)document.documentElement.classList.add("dark");}catch(e){}})();`;
