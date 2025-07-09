const express = require('express');
const router = express.Router();
const House = require('../models/house.model'); 

router.post('/', (req, res) => {
  
  const house = new House({
    ...req.body
  });

  house.save()
    .then(() => res.status(201).json({ message: 'House created successfully!' }))
    .catch(err => res.status(400).json({ error: err.message }));
});

router.get('/:id',(req,res)=>{
    const houseId = req.params.id;
    console.log("House ID:", houseId); // Log the house ID for debugging
    House.findById(houseId)
    .then(house => {
        if (!house) {
            return res.status(404).json({ message: 'House not found' });
        }
        res.status(200).json(house);
    })
    .catch(err => res.status(500).json({ error: err.message }));
})


router.get('/',(req,res)=>{
    
     House.find()
     .then(houses=> res.status(200).json(houses))
      .catch(err => res.status(500).json({ error: err.message }));
    
})

module.exports = router;