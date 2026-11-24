/**
 * BiblioLearn — Core Application JavaScript
 * ESMA Marrakech University
 * Dual-Mode Flexible Theme Engine & Bootstrap 5.3 Utilities
 */

const BiblioLearn = {
    /**
     * Theme management engine for Bootstrap 5.3.3
     */
    theme: {
        getStoredTheme: () => localStorage.getItem('bibliolearn_theme'),
        setStoredTheme: (theme) => localStorage.setItem('bibliolearn_theme', theme),

        getPreferredTheme: function() {
            const stored = this.getStoredTheme();
            if (stored) return stored;
            return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        },

        setTheme: function(theme) {
            let activeTheme = theme;
            if (theme === 'auto') {
                activeTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
            }
            document.documentElement.setAttribute('data-bs-theme', activeTheme);
            this.updateSwitcherUI(theme, activeTheme);
        },

        updateSwitcherUI: function(selectedMode, actualTheme) {
            const themeSwitcher = document.getElementById('bd-theme');
            const themeIcon = document.getElementById('themeActiveIcon');
            if (!themeSwitcher || !themeIcon) return;

            // Update main icon
            themeIcon.className = 'bi';
            if (selectedMode === 'light' || (selectedMode === 'auto' && actualTheme === 'light')) {
                themeIcon.classList.add('bi-sun-fill', 'text-warning');
            } else if (selectedMode === 'dark' || (selectedMode === 'auto' && actualTheme === 'dark')) {
                themeIcon.classList.add('bi-moon-stars-fill', 'text-primary');
            } else {
                themeIcon.classList.add('bi-circle-half', 'text-info');
            }

            // Update active state in dropdown
            document.querySelectorAll('[data-bs-theme-value]').forEach(btn => {
                const val = btn.getAttribute('data-bs-theme-value');
                const checkIcon = btn.querySelector('.theme-check-icon');
                if (val === selectedMode) {
                    btn.classList.add('active');
                    btn.setAttribute('aria-pressed', 'true');
                    if (checkIcon) checkIcon.classList.remove('d-none');
                } else {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                    if (checkIcon) checkIcon.classList.add('d-none');
                }
            });
        },

        init: function() {
            const initialTheme = this.getPreferredTheme();
            this.setTheme(initialTheme);

            // Listen for user clicks on theme selector buttons
            document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const chosen = toggle.getAttribute('data-bs-theme-value');
                    this.setStoredTheme(chosen);
                    this.setTheme(chosen);
                    BiblioLearn.toast(
                        'Theme Mode Updated',
                        `Interface switched to <strong>${chosen.toUpperCase()}</strong> mode.`,
                        'info'
                    );
                });
            });

            // Listen for OS system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                const stored = this.getStoredTheme();
                if (stored === 'auto' || !stored) {
                    this.setTheme(this.getPreferredTheme());
                }
            });
        }
    },

    /**
     * Shows a modern Bootstrap Toast notification
     * @param {string} title - Alert title
     * @param {string} message - Explanatory message
     * @param {string} type - 'success' | 'info' | 'warning' | 'danger'
     */
    toast: function(title, message, type = 'success') {
        const toastEl = document.getElementById('liveToast');
        if (!toastEl) return;

        const titleEl = document.getElementById('toastTitle');
        const bodyEl = document.getElementById('toastBody');
        const iconEl = document.getElementById('toastIcon');

        if (titleEl) titleEl.textContent = title;
        if (bodyEl) bodyEl.innerHTML = message;

        // Update icon based on notification type
        if (iconEl) {
            iconEl.className = 'bi me-2';
            if (type === 'success') {
                iconEl.classList.add('bi-check-circle-fill', 'text-success');
            } else if (type === 'warning') {
                iconEl.classList.add('bi-exclamation-triangle-fill', 'text-warning');
            } else if (type === 'danger') {
                iconEl.classList.add('bi-x-circle-fill', 'text-danger');
            } else {
                iconEl.classList.add('bi-info-circle-fill', 'text-info');
            }
        }

        const bsToast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 4500 });
        bsToast.show();
    },

    /**
     * Simulates a book reservation request at the library desk
     */
    simulerEmprunt: function(title, modalId = null) {
        if (modalId) {
            const modalEl = document.getElementById(modalId);
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
            }
        }

        this.toast(
            'Reservation Confirmed!',
            `Your loan request for <strong>"${title}"</strong> has been recorded. Please present your ESMA student card at the central library desk within 48h.`,
            'success'
        );
    },

    /**
     * Simulates starting an e-learning video course
     */
    demarrerCours: function(title, modalId = null) {
        if (modalId) {
            const modalEl = document.getElementById(modalId);
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
            }
        }

        this.toast(
            'Course Player Ready',
            `Interactive session launched for <strong>"${title}"</strong>. All video capsules and course notes are loaded.`,
            'info'
        );
    },

    /**
     * Copies the ISBN code to clipboard
     */
    copierISBN: function(isbn) {
        if (!isbn || isbn === 'Non spécifié' || isbn === 'Not specified') {
            this.toast('ISBN Unavailable', 'No ISBN code registered for this book.', 'warning');
            return;
        }

        navigator.clipboard.writeText(isbn).then(() => {
            this.toast('ISBN Copied', `ISBN code <code>${isbn}</code> copied to clipboard.`, 'info');
        }).catch(() => {
            this.toast('ISBN Info', `ISBN Code: ${isbn}`, 'info');
        });
    },

    /**
     * Global initialization
     */
    init: function() {
        // Initialize Theme Engine
        this.theme.init();

        // Initialize all Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(el) {
            return new bootstrap.Tooltip(el);
        });

        // Keyboard shortcut: "/" to quickly focus search bar
        document.addEventListener('keydown', function(e) {
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                const searchInput = document.querySelector('input[name="q"]');
                if (searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                    searchInput.select();
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    BiblioLearn.init();
});
