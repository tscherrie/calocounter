interface FoodNutrients {
  productName: string;
  calories: number; // per 100g
  protein: number; // per 100g
  carbs: number; // per 100g
  fat: number; // per 100g
}

export async function searchFood(foodName: string): Promise<FoodNutrients | null> {
  const url = `/api/openfoodfacts/search?q=${encodeURIComponent(foodName.toLowerCase())}&page_size=5&json=true`;
  console.log(`Searching for: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch from OpenFoodFacts');
  }

  const data = await response.json();
  console.log('[searchFood] Raw response from API:', JSON.stringify(data, null, 2));
  
  if (!data.hits || data.hits.length === 0) {
    console.log(`No products found for "${foodName}"`);
    return null;
  }

  // Find the first product with nutrient data
  const product = data.hits.find(
    (p: any) => p.nutriments && p.nutriments['energy-kcal_100g']
  );

  if (!product) {
    console.log(`No product with complete nutrient data found for "${foodName}" in the first ${data.hits.length} results.`);
    return null;
  }

  console.log(`Found product with nutrient data for "${foodName}":`, product);
  const nutriments = product.nutriments;

  return {
    productName: product.product_name || foodName,
    calories: nutriments?.['energy-kcal_100g'] || 0,
    protein: nutriments?.proteins_100g || 0,
    carbs: nutriments?.carbohydrates_100g || 0,
    fat: nutriments?.fat_100g || 0,
  };
} 