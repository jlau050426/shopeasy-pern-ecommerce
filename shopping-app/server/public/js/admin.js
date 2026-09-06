/**
 * @param {HTMLElement} btn
 */
const deleteProduct = async (btn) => {
    const prodId = btn.parentNode.querySelector('[name=productID]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    const productElement = btn.closest('article');

    try {
        //sends HTTP REQUEST to server
        const result = await fetch(`/admin/delete-product/${prodId}`, {
            method: 'DELETE',
            headers: {
                'x-csrf-token': csrf,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                _csrf: csrf
            })
        });

        //receive response from server
        if (!result.ok) {
            throw new Error('Failed to delete product');
        }

        const data = await result.json();

        if (productElement && data.message === 'success!') {
            productElement.remove();
        }
    } catch (error) {
        console.log(error);
    }
};