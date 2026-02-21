import { calculateTotal } from '../lib/cartUtils'

describe('Shopping Cart Logic', () => {
    
    it('should correctly calculate the total of multiple items', () => {
        // 1. Give the Robot a fake cart (Mock Data)
        const mockCart = [
            { price: 100, quantity: 2 }, // 200
            { price: 50, quantity: 1 }   // 50
        ]
        
        // 2. Run your actual code
        const total = calculateTotal(mockCart)
        
        // 3. Demand exactly 250. If it's 251, the Robot fails the build.
        expect(total).toBe(250) 
    })

    it('should return 0 if the cart is empty', () => {
        const mockCart: any[] = []
        const total = calculateTotal(mockCart)
        expect(total).toBe(0)
    })
})