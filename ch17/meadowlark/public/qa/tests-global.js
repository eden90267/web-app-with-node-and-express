/**
 * Created by eden90267 on 2017/6/3.
 */
suite('Global Tests', function () {
    test('page has a valid title', function () {
        assert(document.title && document.title.match(/\S/) &&
            document.title.toUpperCase() !== 'TODO');
    });
});