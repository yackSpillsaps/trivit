<script context=module>
</script>

<script>
    import {onMount} from 'svelte';
    import {polyfill} from 'mobile-drag-drop';

    // optional import of scroll behaviour
    import {scrollBehaviourDragImageTranslateOverride}
        from 'mobile-drag-drop/scroll-behaviour';

    let drag_drop_polyfill_active = false;
    onMount(() => {
        drag_drop_polyfill_active = polyfill();
        make_list_holder_constant_height();
    });

    export let items;

    let is_shown_by_text = {};
    const spaces_between_items = [];

    const FAKE_ITEM = {};
    let expanded_space_index = null;
    let expanded_space_after_move_index = null;
    let dragged_item_index = null;
    let dragged_item = null;
    let expanded_target_height;
    let smooth = false;
    let fade_out_index = null;
    let fade_in_index = null;
    let faded_text = null;

    let potential_drop_index = null;
    $: if (expanded_space_index !== null) {
        if (expanded_space_index < dragged_item_index) {
            potential_drop_index = expanded_space_index;
        } else {
            potential_drop_index = expanded_space_index - 1;
        }
    } else {
        potential_drop_index = dragged_item_index;
    }

    function get_item_height(item) {
        const element = document.getElementById(item.text);
        return window.getComputedStyle(element)
            .getPropertyValue('height');
    }

    async function move_item_to_expanded_index(item, from_index) {
        dragged_item = item;
        dragged_item_index = get_index_with_text(item.text);

        await timeout();
        if (dragged_item_index > -1) {
            put_dragged_element_at(potential_drop_index);
            smooth = false;
            expanded_space_index = from_index;
        }
        await timeout(.1);
    }

    async function expand_index(index, item_height) {
        smooth = true;
        expanded_space_index = index;

        const space_between_items_height = window
            .getComputedStyle(spaces_between_items[0])
            .getPropertyValue('height');

        expanded_target_height = (Number.parseFloat(item_height) +
            2*Number.parseFloat(space_between_items_height)) + 'px';

        await timeout(.6);
        smooth = false;
    }

    async function fade_out(item_text) {
        fade_out_index = get_index_with_text(item_text);
        await timeout(1);
        fade_out_index = null;
        faded_text = item_text;
    }

    async function fade_in(item_text) {
        fade_in_index = get_index_with_text(item_text);
        await timeout(1);
        faded_text = null;
        fade_in_index = null;
    }

    export async function put_item_at_index(item_text, index) {
        const current_index = get_index_with_text(item_text);
        const item = get_item_with_text(item_text);
        if (index !== current_index) {
            const height = get_item_height(item);

            await fade_out(item_text);
            await expand_index(index, height);
            is_shown_by_text[item_text] = true;
            await move_item_to_expanded_index(item, current_index);
            await fade_in(item_text);
            smooth = true;
            expanded_space_index = null;
            await timeout(.1);
        } else {
            await fade_out(item_text);
            is_shown_by_text[item_text] = true;
            await fade_in(item_text);
        }
    }

    export function hide_values() {
        is_shown_by_text = {}
    }

    $: spaces_between_items
        // remove the null one at the end
        .filter(space => space)
        .forEach((space, i) => {
            if (i === expanded_space_index) {
                space.style.height = expanded_target_height;
            } else {
                space.setAttribute('style', null);
            }
        });

    async function on_drag_start(event, index) {
        // Don't let the real event fire if the polyfill is active
        if (drag_drop_polyfill_active && event.isTrusted) {
            event.preventDefault();
            return;
        }

        console.log('on_drag_start', event);
        dragged_item_index = index;
        dragged_item = items[dragged_item_index];

        const dragged_element = event.target;
        // adding the listener to the element via html doesn't work because the
        // element is hidden when we end the drag. Adding it here works.
        dragged_element.addEventListener('dragend', on_drag_end);

        const dragged_element_height = window.getComputedStyle(dragged_element)
            .getPropertyValue('height');

        const space_between_items_height = window
            .getComputedStyle(spaces_between_items[0])
            .getPropertyValue('height');

        expanded_target_height = (Number.parseFloat(dragged_element_height) +
            2*Number.parseFloat(space_between_items_height)) + 'px';

        await timeout();

        expanded_space_index = dragged_item_index + 1;

        items = items.map((item, i) => {
            if (i === dragged_item_index) {
                item.hidden = true;
            }
            return item;
        })
    }

    async function on_drag_end(event) {
        event.preventDefault();
        console.log(event)
        console.log('on_drag_end');
        smooth = false;
        await timeout();
        put_dragged_element_at(potential_drop_index);
    }

    function put_dragged_element_at(index) {
        dragged_item.hidden = false;

        // remove the hidden dragged item
        items = [
            ...items.slice(0, dragged_item_index),
            ...items.slice(dragged_item_index + 1),
        ];
        // and put in its new spot
        items = [
            ...items.slice(0, index),
            dragged_item,
            ...items.slice(index),
        ];

        dragged_item_index = null;
        dragged_item = null,
        expanded_space_index = null;
    }

    function on_drag_over(index) {
        smooth = true;
        expanded_space_index = index;
    }

    // dragenter required on mobile, per
    // github.com/timruffles/mobile-drag-drop#polyfill-requires-dragenter-listener
    // dragover required too
    function do_nothing() {}

    function on_drag_leave_site(index) {
        // comment in to make it more janky
        // expanded_space_index = dragged_item_index + 1;
    }

    async function timeout(seconds = 0) {
        return new Promise((resolve) => {
            setTimeout(resolve, seconds * 1000);
        });
    }

    function get_index_with_text(text) {
        const item = get_item_with_text(text);
        return items.indexOf(item);
    }

    function get_item_with_text(text) {
        return items.find(item => item.text === text);
    }

    function make_list_holder_constant_height() {
        const list_holder = document.getElementById('list_holder')
        const height = window.getComputedStyle(list_holder)
            .getPropertyValue('height');
        list_holder.style.minHeight = height;
    }


</script>

<style>
    :global('html body') {
        margin: 0;
        height: 100%;
        overflow: hidden;
    }
    #wrapper {
        margin: 0 .5em;
    }

    .space-between-item {
        width: 100%;
    }

    .space-between-item.contracted {
        height: 1em;
    }

    .space-between-item.smooth {
        transition: height 0.5s ease-in-out;
        background: red;
    }

    @keyframes fade-out {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .fade-out {
        animation-name: fade-out;
        animation-duration: 1s;
        animation-iteration-count: 1;
        animation-timing-function: linear;
        animation-fill-mode: forwards;
    }

    .fade-in {
        animation-name: fade-in;
        animation-duration: 1s;
        animation-iteration-count: 1;
        animation-timing-function: linear;
        animation-fill-mode: forwards;
    }
    .faded {
        opacity: 0;
    }

</style>

<div id=list_holder>
    {#each [...items, FAKE_ITEM]  as item, index (item.text)}
    <div class=wrapper
        hidden={item.hidden}
        >
        <div bind:this={spaces_between_items[index]}
            id={`drop_target_${index}`}
            class=space-between-item
            class:contracted={index !== expanded_space_index || index !== expanded_space_after_move_index}
            class:contracted-smooth={index === expanded_space_after_move_index}
            class:smooth={smooth || index !== expanded_space_after_move_index}
            on:dragleave|preventDefault={() => on_drag_leave_site(index)}
            on:dragover|preventDefault={() => on_drag_over(index)}
            on:dragenter|preventDefault={do_nothing}
            >
        </div>
        {#if item !== FAKE_ITEM}
        <div
            id={item.text}
            class='button is-medium is-rounded'
            class:fade-out={index === fade_out_index}
            class:faded={item.text === faded_text}
            class:fade-in={index === fade_in_index}
            class:is-success={is_shown_by_text[item.text]}
            draggable=true
            on:dragstart={(event) => on_drag_start(event, index)}
            on:auxclick|preventDefault={do_nothing}
            on:contextmenu|preventDefault={do_nothing}
            >
            {item.text}
            {#if is_shown_by_text[item.text]}
                ({item.value})
            {/if}
        </div>
        {/if}
    </div>
    {/each}
</div>
