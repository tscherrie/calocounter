interface FoodNutrients {
  productName: string;
  calories: number; // per 100g
  protein: number; // per 100g
  carbs: number; // per 100g
  fat: number; // per 100g
}

export async function searchFood(foodName: string): Promise<FoodNutrients | null> {
  const url = `/api/openfoodfacts/search?search_terms=${encodeURIComponent(foodName)}&page_size=1`;
  console.log(`Searching for: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch from OpenFoodFacts');
  }

  const data = await response.json();
  const product = data.products?.[0];

  if (!product) {
    console.log(`No product found for "${foodName}"`);
    return null;
  }

  console.log(`Found product for "${foodName}":`, product);
  const nutriments = product.nutriments;

  return {
    productName: product.product_name || foodName,
    calories: nutriments?.['energy-kcal_100g'] || 0,
    protein: nutriments?.proteins_100g || 0,
    carbs: nutriments?.carbohydrates_100g || 0,
    fat: nutriments?.fat_100g || 0,
  };
} 