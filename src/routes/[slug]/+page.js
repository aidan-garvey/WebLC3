/*
 * [slug]/+page.js
 * 
 *  Returns route name
 */

export const load = ({ params }) => {
    return {
        slug: params.slug
    }
}