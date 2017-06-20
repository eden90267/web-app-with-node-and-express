module.exports = {
    bundles: {

        clientJavaScript: {
            main: {
                file: '/js/meadowlark.min.62a6f623.js',
                location: 'head',
                contents: [
                    '/js/contact.js',
                    '/js/cart.js',
                ]
            }
        },

        clientCss: {
            main: {
                file: '/css/meadowlark.min.d115d0fe.css',
                contents: [
                    '/css/main.css',
                    '/css/cart.css',
                ]
            }
        }

    }
};