require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const imagesDir = path.join(__dirname, 'public', 'images');

async function migrate() {
    try {
        console.log('Starting migration via Supabase SDK...');

        // Check if table exists by doing a simple select
        const { error: checkError } = await supabase.from('products').select('id').limit(1);
        if (checkError && checkError.message.includes('not exist')) {
            console.error('ERROR: Table "products" does not exist in Supabase.');
            console.error('Please run the SQL in schema.sql in your Supabase SQL Editor first.');
            return;
        }

        const files = fs.readdirSync(imagesDir);
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

        for (const file of imageFiles) {
            const filePath = path.join(imagesDir, file);
            const imageData = fs.readFileSync(filePath).toString('base64');
            const productName = path.parse(file).name;
            const mimeType = path.extname(file).substring(1);
            const base64Data = `data:image/${mimeType};base64,${imageData}`;

            console.log(`Uploading ${productName}...`);
            const { error } = await supabase
                .from('products')
                .insert([{ name: productName, image_data: base64Data }]);

            if (error) {
                console.error(`Failed to upload ${productName}:`, error.message);
            } else {
                console.log(`Successfully migrated: ${productName}`);
            }
        }

        console.log('Migration process finished.');
    } catch (err) {
        console.error('Unexpected error during migration:', err);
    }
}

migrate();
