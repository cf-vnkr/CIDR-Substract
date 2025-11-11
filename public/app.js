// CIDR Substract - Client-side JavaScript

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cidr-form');
    const cidr1Input = document.getElementById('cidr1');
    const cidr2Input = document.getElementById('cidr2');
    const resultContainer = document.getElementById('result-container');
    const resultContent = document.getElementById('result-content');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const exampleButtons = document.querySelectorAll('.example-btn');

    // Fetch with timeout helper
    async function fetchWithTimeout(url, options, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - server may not be running. Try: npm run dev');
            }
            throw error;
        }
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cidr1 = cidr1Input.value.trim();
        const cidr2 = cidr2Input.value.trim();

        // Show loading state
        setLoading(true);
        resultContainer.style.display = 'none';

        try {
            const response = await fetchWithTimeout('/api/subtract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cidr1, cidr2 })
            }, 10000); // 10 second timeout

            if (!response.ok) {
                const errorData = await response.json();
                displayResult({
                    success: false,
                    error: errorData.error || `Server error: ${response.status}`
                });
                return;
            }

            const data = await response.json();

            // Display results
            displayResult(data);

        } catch (error) {
            console.error('Error:', error);
            displayResult({
                success: false,
                error: error.message || 'Network error: Unable to connect to the server'
            });
        } finally {
            setLoading(false);
        }
    });

    // Handle example button clicks
    exampleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const cidr1 = btn.getAttribute('data-cidr1');
            const cidr2 = btn.getAttribute('data-cidr2');

            cidr1Input.value = cidr1;
            cidr2Input.value = cidr2;

            // Scroll to form
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Set loading state
    function setLoading(loading) {
        submitBtn.disabled = loading;
        if (loading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'block';
        } else {
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    }

    // Display result
    function displayResult(data) {
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (data.success) {
            if (data.result && data.result.length > 0) {
                resultContent.innerHTML = `
                    <div class="result-message success">
                        <strong>Success!</strong> ${data.message || 'Subtraction completed successfully.'}
                    </div>
                    <div class="result-header">
                        <h3>Remaining CIDR Ranges:</h3>
                        <button class="copy-btn" id="copy-btn">
                            <span class="copy-icon">📋</span>
                            <span class="copy-text">Copy</span>
                        </button>
                    </div>
                    <ul class="result-list">
                        ${data.result.map(cidr => `<li>${escapeHtml(cidr)}</li>`).join('')}
                    </ul>
                `;

                // Add copy button event listener
                const copyBtn = document.getElementById('copy-btn');
                copyBtn.addEventListener('click', () => copyToClipboard(data.result));
            } else {
                resultContent.innerHTML = `
                    <div class="result-message success">
                        <strong>Success!</strong> ${data.message || 'The smaller range completely covers the larger range, leaving no remaining ranges.'}
                    </div>
                `;
            }
        } else {
            resultContent.innerHTML = `
                <div class="result-message error">
                    <strong>Error:</strong> ${escapeHtml(data.error || 'Unknown error occurred')}
                </div>
            `;
        }
    }

    // Copy results to clipboard
    async function copyToClipboard(results) {
        const copyBtn = document.getElementById('copy-btn');
        const copyText = copyBtn.querySelector('.copy-text');
        const originalText = copyText.textContent;

        try {
            // Join all CIDR ranges with newlines
            const text = results.join('\n');

            // Use the modern Clipboard API
            await navigator.clipboard.writeText(text);

            // Show success feedback
            copyBtn.classList.add('copied');
            copyText.textContent = 'Copied!';

            // Reset button after 2 seconds
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyText.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);

            // Fallback for older browsers
            try {
                const textarea = document.createElement('textarea');
                textarea.value = results.join('\n');
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);

                // Show success feedback
                copyBtn.classList.add('copied');
                copyText.textContent = 'Copied!';

                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyText.textContent = originalText;
                }, 2000);
            } catch (fallbackError) {
                copyText.textContent = 'Failed!';
                setTimeout(() => {
                    copyText.textContent = originalText;
                }, 2000);
            }
        }
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Add real-time validation feedback
    function validateCIDR(input) {
        const pattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/;
        return pattern.test(input.value.trim());
    }

    cidr1Input.addEventListener('blur', () => {
        if (cidr1Input.value && !validateCIDR(cidr1Input)) {
            cidr1Input.setCustomValidity('Invalid CIDR format');
        } else {
            cidr1Input.setCustomValidity('');
        }
    });

    cidr2Input.addEventListener('blur', () => {
        if (cidr2Input.value && !validateCIDR(cidr2Input)) {
            cidr2Input.setCustomValidity('Invalid CIDR format');
        } else {
            cidr2Input.setCustomValidity('');
        }
    });

    // Clear validation on input
    cidr1Input.addEventListener('input', () => {
        cidr1Input.setCustomValidity('');
    });

    cidr2Input.addEventListener('input', () => {
        cidr2Input.setCustomValidity('');
    });
});
