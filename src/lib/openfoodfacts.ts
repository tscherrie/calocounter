interface FoodProduct {
  product_name: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

interface FoodNutrients {
  productName: string;
  calories: number; // per 100g
  protein: number; // per 100g
  carbs: number; // per 100g
  fat: number; // per 100g
}

export async function searchFood(foodName: string): Promise<FoodProduct[]> {
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
    return [];
  }

  // Filter products with nutrient data
  const productsWithNutrients = data.hits.filter(
    (p: any) => p.nutriments && p.nutriments['energy-kcal_100g']
  );

  if (productsWithNutrients.length === 0) {
    console.log(`No products with complete nutrient data found for "${foodName}".`);
    return [];
  }

  console.log(`Found ${productsWithNutrients.length} products with nutrient data for "${foodName}"`);
  return productsWithNutrients;
}

// Legacy function for backward compatibility
export async function searchFoodLegacy(foodName: string): Promise<FoodNutrients | null> {
  const products = await searchFood(foodName);
  if (products.length === 0) return null;
  
  const product = products[0];
  const nutriments = product.nutriments;

  return {
    productName: product.product_name || foodName,
    calories: nutriments?.['energy-kcal_100g'] || 0,
    protein: nutriments?.proteins_100g || 0,
    carbs: nutriments?.carbohydrates_100g || 0,
    fat: nutriments?.fat_100g || 0,
  };
} 