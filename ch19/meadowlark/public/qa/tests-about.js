/**
 * Created by eden90267 on 2017/6/3.
 */
suite('"About" Page Tests', function () {
    test('page should contain link to contact page', function () {
        assert($('a[href="/contact"]').length);
    });
});