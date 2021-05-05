'use strict';

const grid_utils = (function()
{
    function required_arg(arg=undefined)
    {
        const error = new Error(`Required argument missing (${arg})`);
        Error.captureStackTrace(error, required_arg);
        throw error;
    }

    // Copied from Underscore.js
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    function debounce(func, wait, immediate)
    {
        let timeout;
        return function()
        {
            const context = this;
            const args = arguments;
            const later = function()
            {
                timeout = null;
                if (! immediate)
                {
                    func.apply(context, args);
                }
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow)
            {
                func.apply(context, args);
            }
        };
    }

    return {
        required_arg: required_arg,
        debounce: debounce,
    };
})();




class GridError extends Error
{
    constructor(message = grid_utils.required_arg('message'))
    {
        super(message);
        this.name = 'GridError';
    }
}

class GridConfigError extends Error
{
    constructor(message = grid_utils.required_arg('message'))
    {
        super(message);
        this.name = 'GridConfigError';
    }
}




/**
 * @class
 * @private
 *
 * A `Grid` is just a grid that is not responsive. Multiple `Grid`
 * instances can be used by the `StaggeredGrid` class to form a responsive grid.
 *
 * @throws {TypeError} - When the new keyword is not used to instantiate a new
 * `Grid` instance.
 */
function Grid({
    grid_element = grid_utils.required_arg('grid_element'),
    mirror_width_container = undefined,

    number_of_cols = 3,
    column_width = 300, // in px
    gutter = 20, // in px
    x_gutter = 20, // in px
    use_translate = false,
    breakpoint = 1200, // in px

    set_width = true,
    set_height = true,
    full_width = false,
    full_width_with_outside_gutters = false,

    animate = false,
    animate_cols = false,
    animate_delay = 0,
    animate_css_class = 'animate',

    rtl = false,

    fixed_width = undefined,
    horizontal_order = false,
})
{
    if (! new.target)
    {
        throw new TypeError('Object cannot be created without the new keyword');
    }


    if (full_width_with_outside_gutters)
    {
        full_width = true;
    }

    if (full_width && fixed_width)
    {
        const warn_msg = (
            'fixed_width and full_width are set in grid '
            + 'configuration. Only full_width will be used.'
        );
        console.warn(warn_msg);
        fixed_width = undefined;
    }

    if (animate || animate_cols)
    {
        if (use_translate)
        {
            console.warn(
                'The grid cannot be animated when use_translate === true.'
            );
            animate = false;
            animate_cols = false;
        }
        else
        {
            animate = true; // Just in case only animate_cols is true
        }
    }


    // Each grid item gets stored in the items array.
    const items = [];


    // Use the column sizes to keep track of each column's height in the grid
    // so that we know where to add a new item. For full width grids, these
    // values have to be recalculated each time the grid gets resized.
    let col_sizes = undefined;
    function reset_col_sizes()
    {
        col_sizes = Array(number_of_cols).fill(0);
    }
    reset_col_sizes();


    /**
     * Add new items to this grid so that we can calculate their positions in
     * the layout.
     *
     * @param {Array} elements - The new HTML elements to add to this grid.
     * This does not literally mean appending these items to the grid; it just
     * means adding them to the items array so that their layout positions can
     * be calculated and then rendered into the grid.
     *
     * @throws {GridConfigError} - When data-width or data-height attributes
     * are missing on the HTML grid item.
     */
    function add_new_items(elements = grid_utils.required_arg('elements'))
    {
        elements.forEach((element, i) =>
        {
            const original_width = element.dataset.width;
            const original_height = element.dataset.height;

            if (element.classList.contains('grid-item'))
            {
                const error_msg = (
                    'Missing data-width or data-height attribute on grid-item'
                );
                if (! original_width || ! original_height)
                {
                    throw new GridConfigError(error_msg);
                }

                items.push({
                    element: element,
                    height: undefined,
                    width: undefined,
                    coords: {
                        x: undefined,
                        y: undefined,
                    },
                    original_width: original_width,
                    original_height: original_height,
                    is_showing: false,
                });
            }
        });
    }

    /**
     * @private
     *
     * Pack the grid by calculating the position of each grid-item element,
     * caching those values and updating the DOM with the calculated values
     * if `render` is set to `true`.
     *
     * @param {Boolean} [obj.render = true] - If set to false the function will
     * not update the DOM.
     * @param {Boolean} [obj.show_items = false] - If set to true the function
     * will make all grid items visible either by animating them or by setting
     * opacity to 1. This is to prevent the function from unnecessarily doing
     * the update.
     */
    function pack({
        render = true,
        show_items = false,
    } = {
        render: true,
        show_items: false,
    })
    {
        let gutters = (gutter * (number_of_cols - 1)) / (number_of_cols);
        if (fixed_width && full_width === false)
        {
            column_width = (fixed_width / number_of_cols) - gutters;
        }

        // Step 1.
        // This has to happen first otherwise there might be some
        // unexpected behaviour.
        if (render)
        {
            if (full_width)
            {
                if (full_width_with_outside_gutters)
                {
                    gutters = gutters + ((gutter * 2) / number_of_cols);
                }
                column_width = (document.documentElement.clientWidth / number_of_cols) - gutters;
            }

            if (set_width)
            {
                const grid_width = number_of_cols * column_width + (gutter * (number_of_cols - 1));
                grid_element.style.width = `${grid_width}px`;
                if (mirror_width_container)
                {
                    mirror_width_container.style.width = `${grid_width}px`;
                    // Set the opacity to 1. If the element's opacity is
                    // not set to 0 the position of the element will not
                    // be correct. Only show the element when it is
                    // correctly placed.
                    mirror_width_container.style.opacity = '1';
                }
            }
            else
            {
                grid_element.style.width = '';
                if (mirror_width_container)
                {
                    mirror_width_container.style.width = '';
                }
            }
        }

        if (full_width)
        {
            // Because full width needs to recalculate the entire grid
            // each time (because the column width isn't fixed).
            reset_col_sizes();
        }

        let delay = 0;
        let i = 0;
        const items_length = items.length;
        let height_of_single_col_layout = 0;
        let next_col = 0; // For horizontal_order
        for (i = 0; i < items_length; i++)
        {
            // Step 2. Calculate the grid. Skip the calculation if the values
            // are already stored.
            const item = items[i];
            let smallest_col = 0;
            let vert_position = 0;
            if (item.coords.x === undefined || item.coords.y === undefined || item.height === undefined || full_width)
            {
                const adjusted_height = column_width * (item.original_height / item.original_width);
                if (number_of_cols !== 1 && horizontal_order === false)
                {
                    [smallest_col, vert_position] = find_smallest_col(); // So we can add the grid item to the shortest column.
                }
                else if (number_of_cols === 1 && horizontal_order === false)
                {
                    vert_position = height_of_single_col_layout;
                }

                if (horizontal_order)
                {
                    smallest_col = next_col;
                    if (next_col < (number_of_cols - 1))
                    {
                        next_col += 1;
                    }
                    else
                    {
                        next_col = 0;
                    }
                    vert_position = col_sizes[smallest_col];
                }

                item.coords.y = vert_position;
                item.coords.x = (column_width + gutter) * smallest_col;
                item.height = adjusted_height;
                item.width = column_width;
                if (rtl && use_translate)
                {
                    item.coords.x = item.coords.x * -1;
                }

                const block_size = item.height + x_gutter;
                vert_position += block_size;
                col_sizes[smallest_col] = vert_position;
                height_of_single_col_layout = vert_position;

                if (animate_cols)
                {
                    item.animate_delay = (animate_delay * smallest_col).toString() + 'ms';
                }
                else if (animate)
                {
                    item.animate_delay = delay.toString() + 'ms';
                    delay += animate_delay;
                }
            }

            // Step 3. Update the DOM.
            if (render)
            {
                item.element.style.width = `${item.width}px`;
                item.element.style.height = `${item.height}px`;

                if (use_translate)
                {
                    item.element.style.transform = `translate(${item.coords.x}px, ${item.coords.y}px)`;
                }
                else
                {
                    item.element.style.top = `${item.coords.y}px`;
                    if (rtl)
                    {
                        item.element.style.right = `${item.coords.x}px`;
                    }
                    else
                    {
                        item.element.style.left = `${item.coords.x}px`;
                    }
                }

                if (item.is_showing === false || show_items)
                {
                    if (animate)
                    {
                        item.element.style.animationDelay = item.animate_delay;
                        item.element.classList.add(animate_css_class);
                    }
                    else
                    {
                        item.element.style.opacity = 1;
                    }
                    item.is_showing = true;
                }
            }
        }

        // Step 4.
        if (render)
        {
            if (set_height)
            {
                const tallest_height = find_tallest_height();
                grid_element.style.height = `${tallest_height}px`;
            }
            else
            {
                grid_element.style.height = '';
            }
        }
    }

    /**
     * @private
     *
     * Finds the shortest column in the grid. So that we know which column to
     * add the next grid item to when calculating the position of each grid item.
     *
     * @returns {Array} - The column number (0, 1, 2, etc) and the height value
     * of the shortest/smallest column in the grid. For example:
     * [smallest_col_index, height_of_smallest_column]
     */
    function find_smallest_col()
    {
        const smallest_value = Math.min(...col_sizes);
        const col_number = col_sizes.indexOf(smallest_value);

        // For example, column 0 is column 1, column 1 is column 2.
        // It has to be the index otherwise the math won't work and you'll end
        // skipping the first column.
        return [col_number, smallest_value];
    }

    /**
     * @private
     *
     * Finds the tallest column in the grid. So that we can calculate the
     * height of the grid.
     *
     * @returns {Number} - The height value of the tallest column.
     */
    function find_tallest_height()
    {
        const tallest = Math.max(...col_sizes) - x_gutter;
        return tallest;
    }

    /**
     * @private
     *
     * Add new items to the grid; does not actually append items to a DOM element.
     * After calling this function you must also call the pack function on the
     * instance to calculate the positions for the new elements that have been
     * added.
     *
     * @param {Array} elements - The new HTML
     * elements to add to the grid's items.
     */
    function update({
        elements = grid_utils.required_arg('elements'),
    })
    {
        add_new_items(elements);
    }

    return {
        add_new_items: add_new_items,
        pack: pack,
        update: update,

        breakpoint: breakpoint,
        full_width: full_width,
        full_width_with_outside_gutters: full_width_with_outside_gutters,
    };
}




/**
 * @class
 *
 * A responsive grid that consists of a bunch of non-responsive grids; `Grid`
 * objects.
 *
 * @throws {TypeError} - When the new keyword is not used to instantiate a new
 * `StaggeredGrid` instance.
 * @throws {GridConfigError} - When the `grid_id` doesn't match an element in the DOM.
 */
function StaggeredGrid({
    layouts = [
        {
            number_of_cols: 1,
            column_width: 100,
            gutter: 20,
            x_gutter: 20,
            breakpoint: 0,
            full_width: true,
            full_width_with_outside_gutters: false,
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
            column_width: 420,
            gutter: 25,
            x_gutter: 25,
            breakpoint: 1350,
            // fixed_width: 400,
        },
    ],
    grid_id = 'staggered-grid',
    mirror_width_container_id = '',

    set_width = true,
    set_height = true,
    min_width_media_queries = true,

    animate = false,
    animate_cols = false,
    animate_delay = 0,
    animate_css_class = 'animate',

    use_translate = false,
    rtl = false,
    active = true,
    horizontal_order = false,
})
{
    if (! new.target)
    {
        throw new TypeError('Object cannot be created without the new keyword');
    }

    const grids = [];
    const media_queries = [];
    const grid_element = document.getElementById(grid_id);
    let mirror_width_container = undefined;
    if (mirror_width_container_id)
    {
        mirror_width_container = document.getElementById(mirror_width_container_id);
    }
    let first_pack = true;

    if (! grid_element)
    {
        throw new GridConfigError('No grid element found in the DOM for StaggeredGrid.');
    }

    function init()
    {
        if (rtl && use_translate)
        {
            // Example of rtl CSS class being added to the grid element:
            // .staggered-grid-rtl .grid-item {
            //     right: 0;
            // }
            grid_element.classList.add('staggered-grid-rtl');
        }
        const prefers_reduced_motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (prefers_reduced_motion.matches)
        {
            animate = false;
            animate_cols = false;
        }
        const elements = Array.from(grid_element.children);
        for (let i = 0; i < layouts.length; i++)
        {
            const layout = layouts[i];
            let conf = {
                grid_element: grid_element,
                mirror_width_container: mirror_width_container,
                set_width: set_width,
                set_height: set_height,
                animate: animate,
                animate_cols: animate_cols,
                animate_delay: animate_delay,
                animate_css_class: animate_css_class,
                use_translate: use_translate,
                rtl: rtl,
                horizontal_order: horizontal_order,
            };
            conf = Object.assign(conf, layout);
            const grid = new Grid(conf);
            grid.add_new_items(elements);
            push(grid);
        }
    }
    init();


    /**
     * Set the state of this grid to active. This means that this grid is
     * currently being used in the UI. This is really just when this grid
     * is being used as part of a `GridCollection`. If the grid is not active
     * then render is implicitly set to false and the DOM will not be updated.
     *
     * @param {Boolean} new_active - The active state to set the grid to.
     */
    function set_active(new_active)
    {
        active = new_active;
    }


    /**
     * @private
     *
     * Add a new `Grid` object to the grids array.
     *
     * @param {Grid} grid - The grid to add.
     */
    function push(grid = grid_utils.required_arg(grid))
    {
        let setting = 'max-width';
        if (min_width_media_queries)
        {
            setting = 'min-width';
        }
        const query = window.matchMedia(`(${setting}: ${grid.breakpoint}px)`);
        query.addListener(pack);
        media_queries.push(query);
        grids.push(grid);
    }


    const debounced_pack = grid_utils.debounce(() =>
    {
        pack();
    }, 80);
    let has_resize_listener = false;

    /**
     * Pack the grid by calculating the position of each grid-item element,
     * caching those values and updating the DOM with the calculated values
     * if `render` is set to `true`.
     *
     * @param {Boolean} [obj.render = true] - If set to false the function will
     * not update the DOM. If active is set to false on the grid then render
     * will automatically be set to false too.
     * @param {Array || NodeList || HTMLCollection} [obj.elements = undefined]
     * - New elements to add to the grid. Only used internally by the `update`
     * function.
     */
    function pack({
        render = true,
        elements = undefined,
    } = {
        render: true,
        elements: undefined,
    })
    {
        if (active === false)
        {
            render = false;
        }

        // Find layout / media query target
        // Pack the grid that matches the media query target.
        const matching_query = find_matching_query();

        for (let i = 0; i < grids.length; i++)
        {
            const grid = grids[i];
            if (grid.breakpoint === matching_query)
            {
                if ((grid.full_width || grid.full_width_with_outside_gutters) && has_resize_listener === false)
                {
                    window.addEventListener('resize', debounced_pack, {passive: true});
                    has_resize_listener = true;
                }
                else if (grid.full_width === false && has_resize_listener === true)
                {
                    window.removeEventListener('resize', debounced_pack, {passive: true});
                    has_resize_listener = false;
                }

                if (elements)
                {
                    grid.update({
                        elements: elements,
                    });
                    // After calling update we must call pack too.
                    grid.pack({
                        render: render,
                        show_items: first_pack,
                    });
                }
                else
                {
                    grid.pack({
                        render: render,
                        show_items: first_pack,
                    });
                }
                break;
            }
        }

        // Only do this the first time the grid is packed or when the grid
        // is being updated with new elements.
        // Calculate all the other possible layouts in advance so
        // we can save some performance on those calculations.
        if (first_pack || elements)
        {
            for (let i = 0; i < grids.length; i++)
            {
                const grid = grids[i];
                if (grid.breakpoint !== matching_query)
                {
                    if (elements)
                    {
                        grid.update({
                            elements: elements,
                        });
                    }
                    grid.pack({render: false});
                }
            }
            first_pack = false;
        }
    }

    /**
     * Update the grid with new elements. Will automatically pack the grid.
     * Keep in mind that this does not append new elements to a DOM element;
     * it merely tells the grid that new elements have already been appended
     * to the DOM and that the grid should calculate the positions for the new
     * items and then update the DOM with the values for positioning.
     *
     * @param {Array || NodeList || HTMLCollection} elements - The new elements
     * to add to the grid. They will not be added to the DOM; they should
     * already be in the DOM.
     * @param {Boolean} [obj.render = true]
     */
    function update({
        elements = grid_utils.required_arg('elements'),
        render = true,
    })
    {
        // The `update` function is really just here to make it clearer about
        // what you're doing when you're adding new elements to an already packed
        // grid, because technically you could use the `pack` function on
        // `StaggeredGrid` to do the update but it's more obvious as to what
        // you're doing when you call this `update` function.
        if (! elements)
        {
            console.warn('Trying to update StaggeredGrid with empty elements arg.');
            return;
        }
        if (Array.isArray(elements) === false)
        {
            elements = Array.from(elements);
        }
        pack({
            elements: elements,
            render: render,
        });
    }

    /**
     * @private
     *
     * Finds the closest matching media query. This is used to figure out
     * which grid should be used for rendering.
     *
     * @returns {Number} - Returns the matching breakpoint of the closest
     * matching media query.
     */
    function find_matching_query()
    {
        let media = undefined;
        const matches = [];

        for (let i = 0; i < media_queries.length; i++)
        {
            const query = media_queries[i];
            if (query.matches)
            {
                media = query.media.split(':')[1].trim();
                media = media.replace(')', '');
                media = media.replace('px', '');
                media = parseInt(media);
                matches.push(media);
            }
        }
        if (min_width_media_queries)
        {
            media = Math.max(...matches);
        }
        else
        {
            media = Math.min(...matches);
        }
        return media;
    }

    return {
        pack: pack,
        update: update,
        set_active: set_active,

        grid_id: grid_id,
        use_translate: use_translate,
        set_width: set_width,
        set_height: set_height,
        min_width_media_queries: min_width_media_queries,
        rtl: rtl,
    };
}




/**
 * @class
 *
 * A GridCollection is just a containing object to store StaggeredGrid instances
 * in so that you can switch between different grid configurations in the UI.
 */
class GridCollection
{
    constructor()
    {
        this.grids = [];
        this.active_grid = undefined;
    }

    /**
     * @private
     *
     * @throws {GridError} - When there is no active grid set on the GridCollection.
     */
    check_if_active_grid()
    {
        if (! this.active_grid)
        {
            throw new GridError('No active grid was set for GridCollection.');
        }
    }

    /**
     * @private
     *
     * @throws {GridConfigError} - When settings between grids in the
     * `GridCollection` mismatch.
     */
    check_grid_settings()
    {
        const grids_length = this.grids.length;
        if (grids_length > 1)
        {
            const grid_for_compare = this.grids[0];
            const mismatching_settings = [];
            for (let i = 1; i < grids_length; i++)
            {
                const current_grid = this.grids[i];
                if (current_grid.grid_id !== grid_for_compare.grid_id)
                {
                    mismatching_settings.push('grid_id');
                }
                if (current_grid.use_translate !== grid_for_compare.use_translate)
                {
                    mismatching_settings.push('use_translate');
                }
                if (current_grid.set_width !== grid_for_compare.set_width)
                {
                    mismatching_settings.push('set_width');
                }
                if (current_grid.set_height !== grid_for_compare.set_height)
                {
                    mismatching_settings.push('set_height');
                }
                if (current_grid.min_width_media_queries !== grid_for_compare.min_width_media_queries)
                {
                    mismatching_settings.push('min_width_media_queries');
                }
                if (current_grid.rtl !== grid_for_compare.rtl)
                {
                    mismatching_settings.push('rtl');
                }
            }

            if (mismatching_settings.length > 0)
            {
                let error_msg = 'The following grid settings do not match in the GridCollection:';
                for (let i = 0; i < mismatching_settings.length; i++)
                {
                    let delimiter = '';
                    if (mismatching_settings.length > 1)
                    {
                        delimiter = ',';
                    }
                    if ((mismatching_settings.length - 1) === i)
                    {
                        delimiter = '.';
                    }
                    error_msg += ' ' + mismatching_settings[i] + delimiter;
                }
                throw new GridConfigError(error_msg);
            }
        }
    }

    /**
     * Set the new active grid for this `GridCollection`.
     *
     * @throws {GridError} - When the grid being set as the new active grid
     * does not exist in the grid collection.
     */
    set_active_grid(new_active_grid)
    {
        let grid_exists_in_collection = false;
        for (let i = 0; i < this.grids.length; i++)
        {
            const grid = this.grids[i];
            if (grid === new_active_grid)
            {
                grid_exists_in_collection = true;
            }
        }

        if (grid_exists_in_collection === false)
        {
            throw new GridError(
                'The grid being set as the new active grid does not exist in '
                + 'the grid collection.'
            );
        }

        this.active_grid = new_active_grid;
        for (let i = 0; i < this.grids.length; i++)
        {
            this.grids[i].set_active(false);
        }
        this.active_grid.set_active(true);
    }

    /**
     * Add a new grid to the `GridCollection`. If trying to add a grid that
     * already exists in the collection: that grid will not be added.
     */
    push(grid)
    {
        // First, make sure we aren't adding a grid
        // that already exists in the collection.
        let add_to_collection = true;
        for (let i = 0; i < this.grids.length; i++)
        {
            const grid_for_compare = this.grids[i];
            if (grid === grid_for_compare)
            {
                add_to_collection = false;
            }
        }

        if (add_to_collection)
        {
            this.grids.push(grid);
            this.check_grid_settings();
        }
    }

    /**
     * Packs all the grids in the collection. Packs the active grid first.
     *
     * @throws {GridError} - When there is no active grid set on the GridCollection.
     */
    pack()
    {
        this.check_if_active_grid();
        this.active_grid.pack();

        for (let i = 0; i < this.grids.length; i++)
        {
            const grid = this.grids[i];
            if (grid !== this.active_grid)
            {
                grid.pack();
            }
        }
    }

    /**
     * Updates all the grids in the `GridCollection` with new elements. Will
     * automatically pack the grids.
     */
    update(new_elements)
    {
        if (! new_elements)
        {
            console.warn('Trying to update with empty elements arg.');
            return;
        }
        this.check_if_active_grid();

        // Update the active grid first; then update the inactive grids.
        this.active_grid.update({
            elements: new_elements,
            render: true,
        });

        for (let i = 0; i < this.grids.length; i++)
        {
            const grid = this.grids[i];
            if (grid !== this.active_grid)
            {
                grid.update({
                    elements: new_elements,
                    render: false,
                });
            }
        }
    }
}
