$(document).ready(function () {
    $('.dashboard').on('click', function () {
        postData('/getDashboard')
            .then(response => {
                // Handle the response, e.g., check for success and redirect if needed
                if (response.ok) {
                    window.location.href = '/dashboard';
                } else {
                    console.error('Error:', response.statusText);
                    // Handle the error, e.g., show an error message to the user
                }
            })
            .catch(error => {
                console.error('Error:', error);
                // Handle the error, e.g., show an error message to the user
            });
    });

    $('.liga').on('click', function () {
        location.reload();
    });

    $('.verein').on('click', function () {
        postData('/getVerein')
            .then(response => {
                // Handle the response, e.g., check for success and redirect if needed
                if (response.ok) {
                    window.location.href = '/verein';
                } else {
                    console.error('Error:', response.statusText);
                    // Handle the error, e.g., show an error message to the user
                }
            })
            .catch(error => {
                console.error('Error:', error);
                // Handle the error, e.g., show an error message to the user
            });
    });
    $('.marktplatz').on('click', function () {
        postData('/getMarktplatz')
            .then(response => {
                // Handle the response, e.g., check for success and redirect if needed
                if (response.ok) {
                    window.location.href = '/marktplatz';
                } else {
                    console.error('Error:', response.statusText);
                    // Handle the error, e.g., show an error message to the user
                }
            })
            .catch(error => {
                console.error('Error:', error);
                // Handle the error, e.g., show an error message to the user
            });
    });

    function postData(url) {
        // Use fetch API to perform a POST request
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
});