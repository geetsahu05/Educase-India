require('dotenv').config();
const express = require('express');
const db = require('./server');
const app = express();

app.use(express.json());

function getDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degree) => (degree * Math.PI) / 180;
    const R = 6371; 
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}


app.post('/add_School', async (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
            [name, address, parseFloat(latitude), parseFloat(longitude)]
        );

        res.status(201).json({ message: 'School added successfully', schoolId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/listSchools', async (req, res) => {

    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {

        return res.status(400).json({ error: 'Latitude and longitude are required' });

    }

    try {
        const [schools] = await db.query('SELECT * FROM schools');

        const userLat = parseFloat(latitude);
        const userLon = parseFloat(longitude);

        const sortedSchools = schools.map(school => ({

                ...school,
                distance: getDistance(userLat, userLon, school.latitude, school.longitude)

            }))
            .sort((a, b) => a.distance - b.distance);

        res.json(sortedSchools);

    } catch (error) {

        console.error(error);
        res.status(500).json({ error: 'Database error' });

    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));