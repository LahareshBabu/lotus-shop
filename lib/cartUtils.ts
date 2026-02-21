export function calculateTotal(items: { price: number; quantity: number }[]) {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
}