# Staggered grid

A light (7KB minified), performant, dependency-free masonry/staggered grid
"layout engine" that assumes you know the height and width of each grid item
in advance; the given height and width will be recalculated based on the
column width to maintain aspect ratio.


Demo
----
See a demo of the package [here][3].


Features
--------
- Responsive masonry-style grid layout.
- Optionally, maintain original order of elements in the grid; 1234 instead of 1243.
- Supports full width layouts (with or without outside gutters).
- Supports fixed grid width.
- Supports updating the grid with new elements.
- Grid can be animated using CSS animations.
- Supports switching between two or more grid configurations using `GridCollection`.
- Supports right-to-left layouts.
- Checks `prefers-reduced-motion` media query and disables animation on the grid if required.


Quickstart
----------
1. Include the JS before your closing `<body>` tag.
```html
<script src="https://cdn.jsdelivr.net/gh/armandtvz/staggered-grid@1.0.0-beta/dist/js/staggered_grid.min.js" charset="utf-8"></script>
```

1. Include the CSS.
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/armandtvz/staggered-grid@1.0.0-beta/dist/css/staggered_grid.min.css">
```

1. Initialize the `StaggeredGrid` object. See the [config options][100] heading
   for more info on the configuration. For example:
```javascript
// Gutter, column width and breakpoint values are in pixels.
const grid = new StaggeredGrid({
    grid_id = 'staggered-grid',
    layouts: [
        {
            number_of_cols: 1,
            gutter: 20,
            x_gutter: 20,
            breakpoint: 0,
            full_width: true,
            // full_width_with_outside_gutters: false, // false by default
            // column_width: 100, // column_width value does not matter when full width
        },
        {
            number_of_cols: 2,
            column_width: 250,
            gutter: 20,
            x_gutter: 20,
            breakpoint: 600,
        },
        {
            number_of_cols: 2,
            column_width: 400,
            gutter: 20,
            x_gutter: 20,
            breakpoint: 900,
        },
        {
            number_of_cols: 3,
            column_width: 400,
            gutter: 25,
            x_gutter: 25,
            breakpoint: 1300,
        },
    ],
});
grid.pack();
```

1. Build the HTML. Remember that you need to provide the height and the width
   of the element in the `data-width` and `data-height` data attributes. For
   example, the height and width of a grid item that wraps an image would be
   the height and width of the image. Also, the element must have the
   `grid-item` class; otherwise the element will be ignored when calculating
   the layout. Make sure to use the `staggered-grid` CSS class on the grid
   element.
```html
<div class="staggered-grid center" id="staggered-grid">
        <div class="grid-item" data-width="{{ width }}" data-height="{{ height }}" style="background-color: #eaeaea; opacity: 0; position: absolute;">
                  <img src="{{ url }}" alt="{{ alt_text }}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div class="grid-item" data-width="{{ width }}" data-height="{{ height }}" style="background-color: #eaeaea; opacity: 0; position: absolute;">
                  <img src="{{ url }}" alt="{{ alt_text }}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div class="grid-item" data-width="{{ width }}" data-height="{{ height }}" style="background-color: #eaeaea; opacity: 0; position: absolute;">
                  <img src="{{ url }}" alt="{{ alt_text }}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        ...
</div>
```


How the position of elements are calculated
-------------------------------------------
By default, an item being positioned gets sent to the shortest column;
therefore, closest to the top. However, if you absolutely need to preserve
the original order of elements then you can set the `horizontal_order` setting
to `true`. Keep in mind that preserving the original order will not balance
the columns (make them roughly the same height): so one or more columns might
be much longer than the others.


Updating the grid after new items have been added
-------------------------------------------------
Each grid item's opacity should be set to 0. This is not included in
`staggered_grid.css`. This means that the element won't be visible until it is
make so by this package. Of course, this also means that any newly added grid
items won't be immediately visible.
```javascript
grid.update({
    elements: event.detail.array_of_html_elements,
    render: true,
});

// When using GridCollection instead of just one StaggeredGrid:
// grids.update(event.detail.new_elements);
```

Also, remember that there are no protections to check that you don't pass in
the same HTML element twice, therefore, referencing an element that has already
been processed. In such a case, if you update the grid with elements that have
already been processed, those elements will shift down as if being appended to
the grid.


Animating the grid
------------------
When animating the grid, the package simply adds a CSS class to each grid item.
By default, this CSS class is `animate` and is included in the
`staggered_grid.css` file. This CSS class uses a CSS keyframe animation.
See the configuration options section for more info on animation options.

This package also honors `prefers-reduced-motion`. When `prefers-reduced-motion`
is set on the user's browser all animations on the grid are switched off; unless
of course you have your own animations set on the grid.


Centering the grid
------------------
Firstly, make sure that `set_width` is set to `true`. Then add the `center`
CSS class to the staggered grid element. For example:
```html
<div class="staggered-grid center" id="staggered-grid">
    ...
</div>
```

Or you can use your own CSS:
```CSS
.staggered-grid {
    margin-left: auto;
    margin-right: auto;
}
```


Switching between two or more grid configurations
-------------------------------------------------
```javascript
// Initially, show this grid.
const grid = new StaggeredGrid({
    layouts: [
        ...
    ],
    // active: true, // true by default
});

// Initially, don't show this grid.
const grid2 = new StaggeredGrid({
    layouts: [
        ...
    ],
    active: false,
});

const grids = new GridCollection();
grids.push(grid);
grids.push(grid2);
grids.set_active_grid(grid);
grids.pack();

document.getElementById('toggle-grid-btn').addEventListener('click', toggle_grid);
function toggle_grid()
{
    if (grids.active_grid === grid)
    {
        grids.set_active_grid(grid2);
    }
    else
    {
        grids.set_active_grid(grid);
    }
    grids.pack();
}
```
The following settings need to remain consistent across `StaggeredGrid` objects
in the `GridCollection` otherwise an error will be thrown if there is a mismatch.
- grid_id
- use_translate
- min_width_media_queries
- set_width
- set_height
- rtl


Performance
-----------
- No resize listeners are used unless the grid is set to full width; a listener
  on the [`MediaQueryList`][4] object is used instead. This performs much better
  than a debounced resize listener.
- When using a full width grid, the grid needs to be constantly recalculated;
  in other cases the values are cached.


What this package does not do
-----------------------------
- No column spanning. Adding this feature is still being considered.
- No percentage values; only pixel values.


Compatiblity
------------
- This package does not support Internet Explorer or Opera Mini.
- Written in ES6 ([caniuse.com][2]).
- This package uses [`MediaQueryList`][5] which is still flagged as experimental
  but has [good browser support][5].

Therefore, according to the Caniuse page (full support, not partial support):
- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 15+
- Opera 38+
- iOS Safari 10+
- Chrome for Android 84
- Firefox for Android 68


Before you use a masonry-style staggered grid
---------------------------------------------
Staggered grids are an especially bad choice for displaying organised
information to a user. Don't use a grid like this for anything except
discovery/exploration-type layouts or image galleries. Not only is it a bad
choice for the aforementioned reason but the grid as-implemented in this JS
package, and in so many others, is far less performant than a grid using only
HTML and CSS. However, it does work well for a grid of images where you don't
want the images to crop-to-fit a container.




Config options
--------------
An example config:
```javascript
const grid = new StaggeredGrid({
    layouts: [
        {
            number_of_cols: 1,
            column_width: 100,
            gutter: 20,
            x_gutter: 20,
            breakpoint: 0,
            full_width: true,
        },
        {
            number_of_cols: 2,
            column_width: 250,
            gutter: 20,
            x_gutter: 20,
            breakpoint: 600,
        },
        {
            number_of_cols: 2,
            column_width: 400,
            gutter: 20,
            x_gutter: 20,
            breakpoint: 900,
        },
        {
            number_of_cols: 3,
            column_width: 400,
            gutter: 25,
            x_gutter: 25,
            breakpoint: 1300,
        },
    ],
    set_width: true,
    set_height: true,
    min_width_media_queries: true,

    animate: true,
    animate_delay: 50,
    animate_cols: true,

    use_translate: false,

    rtl: false, // right-to-left layout
});
```

### grid_id (required)
The ID of the HTML element to use as the grid.

| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| String       | required     |              |


### set_width
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Boolean      |              | true         |

Set the width CSS property on the grid element. If `fixed_width` is set and
`set_width` is not the grid will still be the correct fixed width as set in
`fixed_width`; the CSS property just won't be set.


### set_height
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Boolean      |              | true         |

Set the height CSS property on the grid element.


### min_width_media_queries
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Boolean      |              | true         |

Setting this to `true` will use `min-width` media queries and `false` will
use `max-width`.


### animate
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Boolean      |              | false        |

Set this to `true` to animate the grid. See more info under
"[animating the grid][101]".


### animate_delay
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Number       |              | 0            |

Set the CSS `animation-delay` in milliseconds to stagger the animation of
grid elements.


### animate_cols
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Boolean      |              | false        |

Setting this to `true` implicitly sets `animate` to true.
Use this to animate the grid columns instead of individual grid items. Only
useful for staggering the animation using the `animate_delay` option. All
this does is set the same CSS `animation-delay` value to each grid item that's
in the same column.


### animate_css_class
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| String       |              | animate      |

The CSS class to add to each grid item for animation.


### use_translate
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Boolean      |              | false        |

Setting this to `true` will use CSS `translate` on grid elements instead of
offset (top, left, right, bottom) position values. When using `use_translate`
with right-to-left layouts the package will automatically add a `.rtl` CSS
class to the staggered grid HTML element.


### rtl
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Boolean      |              | false        |

Set to `true` for right-to-left layouts. Will position all elements from
right to left.


### active
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Boolean      |              | true         |

Use with `GridCollection` to allow switching between two or more grid
configurations. Setting this to `false` implicitly sets `render` to `false`
when packing the grid.


### horizontal_order
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Boolean      |              | false        |

Use to position elements in the exact order they are in the
DOM instead of positioning elements closest to the top.


### layouts (required)
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Array        | required     |              |

Each layout is like a CSS media query; different settings for different
breakpoints.


#### number_of_cols
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Number       | required     | 3            |

Number of columns for grid.


#### column_width
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Number       |              | 300          |

Column width in pixels. This value doesn't matter for full or fixed width
layouts.


#### gutter
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Number       |              | 20           |

The column gutter in pixels.


#### x_gutter
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Number       |              | 20           |

The row gutter in pixels.


#### breakpoint
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Number       |              | 1200         |

Breakpoint to use for media query.


#### full_width
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Boolean      |              | false        |

Set this to `true` to make the grid full width.


#### full_width_with_outside_gutters
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Boolean      |              | false        |

Full width while keeping a space on the outside of the grid equal to the gutter.
Of course, this only really works when the grid is centered.


#### fixed_width
| Type         | Attributes   | Default      |
| ------------ | ------------ | ------------ |
| Number       |              |              |

Fixed width in pixels. Setting this will make the grid adjust the column width
to fit to this value exactly.




Versioning
----------
This package follows [semantic versioning][1] (SemVer).


License, contributing and code of conduct
-----------------------------------------
Check the root of the repo for these files.




[//]: # (Links)

[1]: https://semver.org/
[2]: https://caniuse.com/#feat=es6
[3]: https://armandtvz.com/demos/staggered-grid/
[4]: https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList
[5]: https://caniuse.com/#feat=mdn-api_mediaquerylist

[100]: #config-options
[101]: #animating-the-grid
