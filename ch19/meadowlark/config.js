module.exports = {
    bundles: {

        clientJavaScript: {
            main: {
                file: '/js/meadowlark.min.6dfde63e.js',
                location: 'head',
                contents: [
                    '/js/contact.js',
                    '/js/cart.js',
                ]
            }
        },

        clientCss: {
            main: {
                file: '/css/meadowlark.min.db14011e.css',
                contents: [
                    '/css/main.css',
                    '/css/cart.css',
                ]
            }
        }

    }
};