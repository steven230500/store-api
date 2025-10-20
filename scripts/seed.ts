import 'reflect-metadata';
import { AppDataSource } from '../datasource';
import { ProductOrmEntity } from '../src/infrastructure/persistence/typeorm/product.orm-entity';
import { CategoryOrmEntity } from '../src/infrastructure/persistence/typeorm/category.orm-entity';

const PRODUCTS = [
  {
    name: 'Arroz Diana 1kg',
    price_in_cents: 450000,
    stock: 50,
    category: 'Abarrotes',
  },
  {
    name: 'Lentejas La Muñeca 500g',
    price_in_cents: 380000,
    stock: 45,
    category: 'Abarrotes',
  },
  {
    name: 'Fríjoles Cargamanto 500g',
    price_in_cents: 420000,
    stock: 40,
    category: 'Abarrotes',
  },
  {
    name: 'Aceite Premier 1000ml',
    price_in_cents: 1250000,
    stock: 30,
    category: 'Abarrotes',
  },
  {
    name: 'Sal Refisal 1000g',
    price_in_cents: 280000,
    stock: 60,
    category: 'Abarrotes',
  },
  {
    name: 'Azúcar Manuelita 1000g',
    price_in_cents: 390000,
    stock: 55,
    category: 'Abarrotes',
  },
  {
    name: 'Harina PAN 1kg',
    price_in_cents: 670000,
    stock: 35,
    category: 'Abarrotes',
  },
  {
    name: 'Pasta Doria Spaghetti 500g',
    price_in_cents: 490000,
    stock: 45,
    category: 'Abarrotes',
  },
  {
    name: 'Salsa de Tomate Fruco 400g',
    price_in_cents: 520000,
    stock: 40,
    category: 'Abarrotes',
  },

  {
    name: 'Pan Bimbo Grande',
    price_in_cents: 620000,
    stock: 35,
    category: 'Panadería',
  },
  {
    name: 'Cereal Zucaritas 500g',
    price_in_cents: 1499000,
    stock: 22,
    category: 'Cereales',
  },
  {
    name: 'Avena Quaker 500g',
    price_in_cents: 680000,
    stock: 40,
    category: 'Cereales',
  },

  {
    name: 'Café Sello Rojo 500g',
    price_in_cents: 1380000,
    stock: 25,
    category: 'Bebidas',
  },
  {
    name: 'Chocolate Corona 250g',
    price_in_cents: 870000,
    stock: 32,
    category: 'Bebidas',
  },
  {
    name: 'Leche Alquería 1L',
    price_in_cents: 480000,
    stock: 60,
    category: 'Bebidas',
  },
  {
    name: 'Agua Cristal 600ml',
    price_in_cents: 220000,
    stock: 80,
    category: 'Bebidas',
  },
  {
    name: 'Jugo Hit Mango 1L',
    price_in_cents: 560000,
    stock: 35,
    category: 'Bebidas',
  },
  {
    name: 'Coca-Cola 1.5L',
    price_in_cents: 780000,
    stock: 50,
    category: 'Bebidas',
  },
  {
    name: 'Postobón Manzana 1.5L',
    price_in_cents: 720000,
    stock: 45,
    category: 'Bebidas',
  },

  {
    name: 'Galletas Festival Chocolate',
    price_in_cents: 380000,
    stock: 70,
    category: 'Snacks',
  },
  {
    name: 'Galletas Saltín Noel 9 und',
    price_in_cents: 520000,
    stock: 50,
    category: 'Snacks',
  },
  {
    name: 'Papas Margarita Natural 160g',
    price_in_cents: 790000,
    stock: 30,
    category: 'Snacks',
  },
  {
    name: 'Chocoramo Individual',
    price_in_cents: 350000,
    stock: 60,
    category: 'Snacks',
  },
  {
    name: 'Jet Chocolate 12 und',
    price_in_cents: 980000,
    stock: 25,
    category: 'Snacks',
  },

  {
    name: 'Queso Campesino Alpina 250g',
    price_in_cents: 1699000,
    stock: 25,
    category: 'Lácteos',
  },
  {
    name: 'Mantequilla La Fina 250g',
    price_in_cents: 980000,
    stock: 40,
    category: 'Lácteos',
  },
  {
    name: 'Yogurt Alpina Fresa 1L',
    price_in_cents: 1250000,
    stock: 35,
    category: 'Lácteos',
  },
  {
    name: 'Huevos Kikes 30 und',
    price_in_cents: 1650000,
    stock: 20,
    category: 'Huevos',
  },

  {
    name: 'Detergente Ariel 2kg',
    price_in_cents: 2199000,
    stock: 18,
    category: 'Aseo Hogar',
  },
  {
    name: 'Jabón Rey Barra x3',
    price_in_cents: 890000,
    stock: 50,
    category: 'Aseo Hogar',
  },
  {
    name: 'Suavitel Fresca Primavera 1L',
    price_in_cents: 990000,
    stock: 25,
    category: 'Aseo Hogar',
  },
  {
    name: 'Clorox Tradicional 1L',
    price_in_cents: 720000,
    stock: 40,
    category: 'Aseo Hogar',
  },
  {
    name: 'Papel Higiénico Familia 12 und',
    price_in_cents: 1899000,
    stock: 40,
    category: 'Aseo Hogar',
  },
  {
    name: 'Servilletas Familia 100 und',
    price_in_cents: 630000,
    stock: 55,
    category: 'Aseo Hogar',
  },

  {
    name: 'Shampoo Savital Sábila 550ml',
    price_in_cents: 1180000,
    stock: 25,
    category: 'Cuidado Personal',
  },
  {
    name: 'Crema Dental Colgate Triple Acción 150ml',
    price_in_cents: 790000,
    stock: 45,
    category: 'Cuidado Personal',
  },
  {
    name: 'Desodorante Rexona Men 150ml',
    price_in_cents: 1290000,
    stock: 30,
    category: 'Cuidado Personal',
  },
  {
    name: 'Jabón Protex 3 und',
    price_in_cents: 990000,
    stock: 35,
    category: 'Cuidado Personal',
  },

  {
    name: 'Jamón Zenú Tradicional 200g',
    price_in_cents: 1350000,
    stock: 28,
    category: 'Cárnicos',
  },
  {
    name: 'Salchichas Ranchera 500g',
    price_in_cents: 1650000,
    stock: 30,
    category: 'Cárnicos',
  },
  {
    name: 'Tocineta Zenú 250g',
    price_in_cents: 1899000,
    stock: 20,
    category: 'Cárnicos',
  },

  {
    name: 'Banano (kg)',
    price_in_cents: 350000,
    stock: 40,
    category: 'Frutas y Verduras',
  },
  {
    name: 'Tomate Chonto (kg)',
    price_in_cents: 420000,
    stock: 35,
    category: 'Frutas y Verduras',
  },
  {
    name: 'Papa Criolla (kg)',
    price_in_cents: 550000,
    stock: 30,
    category: 'Frutas y Verduras',
  },
  {
    name: 'Cebolla Cabezona (kg)',
    price_in_cents: 490000,
    stock: 25,
    category: 'Frutas y Verduras',
  },
];

async function main() {
  await AppDataSource.initialize();
  const productRepo = AppDataSource.getRepository(ProductOrmEntity);
  const categoryRepo = AppDataSource.getRepository(CategoryOrmEntity);

  const uniqueCategories = [...new Set(PRODUCTS.map((p) => p.category))];
  const categoriesMap: Record<string, string> = {};

  for (const categoryName of uniqueCategories) {
    let category = await categoryRepo.findOne({
      where: { name: categoryName },
    });
    if (!category) {
      category = categoryRepo.create({ name: categoryName });
      await categoryRepo.save(category);
      console.log(`Categoría creada: ${categoryName} (${category.id})`);
    }
    categoriesMap[categoryName] = category.id;
  }

  for (const p of PRODUCTS) {
    const exists = await productRepo.findOne({ where: { name: p.name } });

    if (!exists) {
      const entity = productRepo.create({
        name: p.name,
        price_in_cents: p.price_in_cents,
        currency: 'COP',
        stock: p.stock,
        category: p.category,
        category_id: categoriesMap[p.category],
      });
      await productRepo.save(entity);
      console.log(`Insertado ${p.name}`);
    } else {
      console.log(`Ya existía ${p.name}`);
    }
  }

  console.log('\n Seeds completados con éxito');
  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error('Error ejecutando seeds:', e);
  process.exit(1);
});
