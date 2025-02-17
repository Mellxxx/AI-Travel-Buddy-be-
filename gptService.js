const axios = require('axios');

async function getTravelRecommendations(preferences, budget, location, previousCountries = []) {
    const excludedCountries = previousCountries.length > 0 ? previousCountries.join(', ') : "None";
    const prompt = `Based on the following prefrences:

Prefrenes: ${preferences.join(', ')} 
(choosen from these options:  "Chill", "Relax", "Romantic", "Luxury", "Sport", "Hiking", "Skiing/Snowboarding", "Adventure",
"Work", "Party", "Sight Seeing", "Beach", "Nature", "Cultural", "Food & Drink", "Shopping",
"Spa & Wellness", "Family", "City Tour", "Nightlife", "Camping", "Wildlife")

Budget: ${budget} 
(choosen from these options: "$ low", "$$ medium", "$$$ higher", "$$$$ expensive")

Current Location: ${location} (when suggesting countrys far away from the current location, pls also take the cost of the flight into consideration)

Suggest me exactly five different countries and return the answer in exactly this JSON format:
[
  {
    "country": "Country Name",
    "description": "Short description why this could be the best choice based on the criteria. Max. 200 characters."
    "cost": "Estimation of what the overall cost (inkl flight) coud be for one person for 5 days. (In this object only provide for eg "800 $" - so the number and currency symbol. Change the currency symbol based on where the current location is - use $ for no selected location, however use the local currency from the current Country if it has been provided (eg. Current Location = "Austria" => use "€"))"

  },
  {
    "country": "Country Name",
    "description": "Short description why this could be the best choice based on the criteria. Max. 200 characters."
    "cost": "Estimation of what the overall cost (inkl flight) coud be for one person for 5 days. (In this object only provide for eg "800 $" - so the number and currency symbol. Change the currency symbol based on where the current location is - use $ for no selected location, however use the local currency from the current Country if it has been provided (eg. Current Location = "Austria" => use "€"))"
  },
  {
    "country": "Country Name",
    "description": "Short description why this could be the best choice based on the criteria. Max. 200 characters."
    "cost": "Estimation of what the overall cost (inkl flight) coud be for one person for 5 days. (In this object only provide for eg "800 $" - so the number and currency symbol. Change the currency symbol based on where the current location is - use $ for no selected location, however use the local currency from the current Country if it has been provided (eg. Current Location = "Austria" => use "€"))"
  },
  {
    "country": "Country Name",
    "description": "Short description why this could be the best choice based on the criteria. Max. 200 characters."
    "cost": "Estimation of what the overall cost (inkl flight) coud be for one person for 5 days. (In this object only provide for eg "800 $" - so the number and currency symbol. Change the currency symbol based on where the current location is - use $ for no selected location, however use the local currency from the current Country if it has been provided (eg. Current Location = "Austria" => use "€"))"
  },
  {
    "country": "Ländername",
    "description": "Short description why this could be the best choice based on the criteria. Max. 200 characters."
    "cost": "Estimation of what the overall cost (inkl flight) coud be for one person for 5 days. (In this object only provide for eg "800 $" - so the number and currency symbol. Change the currency symbol based on where the current location is - use $ for no selected location, however use the local currency from the current Country if it has been provided (eg. Current Location = "Austria" => use "€"))"
  },
]

IMPORTANT: Answer only with the JSON object without additional explanations or introductions and any text. Answer only in the JSON format, as shown above
IMPORTANT: Do NOT suggest countries that were already listed: **${excludedCountries}**.`;

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 800,
                n: 1,
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 10000
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const gptResponse = response.data.choices[0].message.content.trim();

            const jsonStartIndex = gptResponse.indexOf('[');
            const jsonEndIndex = gptResponse.lastIndexOf(']') + 1;

            if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
                const jsonString = gptResponse.substring(jsonStartIndex, jsonEndIndex);

                const recommendations = JSON.parse(jsonString);

                if (Array.isArray(recommendations) && recommendations.every(item => item.country && item.description)) {
                    return recommendations;
                } else {
                    throw new Error("Ungültiges Antwortformat: Das JSON-Array enthält nicht die erwarteten Objekte.");
                }
            } else {
                throw new Error("Konnte kein gültiges JSON-Array in der Antwort finden.");
            }

        } else {
            throw new Error("Ungültige Antwort von der OpenAI API.");
        }

    } catch (error) {
        if (error.response) {
            console.error('Fehler bei der OpenAI-Anfrage:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Keine Antwort erhalten:', error.request);
        } else {
            console.error('Fehler bei der Anfrage:', error.message);
        }

        throw new Error("Fehler bei der Empfehlungsgenerierung: " + error.message);
    }
}

async function getPlacesRecommendations(preferences, budget, country) {

    const prompt = `You are a travel assistant that follows instructions **strictly**.

    Suggest exactly six different places to visit in **${country}** for a vacation.  
    The recommendations should be based on the following user preferences and budget:
    
    Preferences: ${preferences.join(', ')}
    Budget: ${budget}  
    (The budget is chosen from these options: "$ low", "$$ medium", "$$$ higher", "$$$$ expensive")
    
    IMPORTANT INSTRUCTIONS:  
    - **Only recommend places located in ${country}.**  
    - **Always include the country name explicitly** in each response.  
    - Your response **MUST be valid JSON** with exactly six objects in this format:  
    
    [
      { 
        "place": "Name of the place in ${country}", 
        "description": "300-400 characters description based on preferences and budget. Make sure to explicitly mention '${country}' at least once in the description." 
      },
      { 
        "place": "Name of the place in ${country}", 
        "description": "300-400 characters description based on preferences and budget. Make sure to explicitly mention '${country}' at least once in the description." 
      },
      { 
        "place": "Name of the place in ${country}", 
        "description": "300-400 characters description based on preferences and budget. Make sure to explicitly mention '${country}' at least once in the description." 
      },
      { 
        "place": "Name of the place in ${country}", 
        "description": "300-400 characters description based on preferences and budget. Make sure to explicitly mention '${country}' at least once in the description." 
      },
      { 
        "place": "Name of the place in ${country}", 
        "description": "300-400 characters description based on preferences and budget. Make sure to explicitly mention '${country}' at least once in the description." 
      },
      { 
        "place": "Name of the place in ${country}", 
        "description": "300-400 characters description based on preferences and budget. Make sure to explicitly mention '${country}' at least once in the description." 
      }
    ]
    
    - **DO NOT** include any introductory text, explanations, or additional formatting.  
    - **DO NOT** add any text before or after the JSON response.  
    - The JSON **must be valid and properly formatted**.  
    - If no suitable places are found in ${country}, return an **empty JSON array: []**.  
    `;

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1000,
                n: 1,
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 15000
            }
        );

        if (!response.data.choices || response.data.choices.length === 0) {
            throw new Error("Invalid response format: No choices returned.");
        }

        const gptResponse = response.data.choices[0].message.content.trim();

        try {
            const recommendations = JSON.parse(gptResponse);

            if (Array.isArray(recommendations) && recommendations.every(item => item.place && item.description)) {
                return recommendations;
            } else {
                throw new Error("Ungültiges JSON-Format von OpenAI.");
            }
        } catch (jsonError) {
            throw new Error("Fehler beim JSON-Parsing: " + jsonError.message);
        }

    } catch (error) {
        if (error.response) {
            console.error('Fehler bei der OpenAI-Anfrage:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Keine Antwort erhalten:', error.request);
        } else {
            console.error('Fehler bei der Anfrage:', error.message);
        }
        throw new Error("Fehler bei der Empfehlungsgenerierung: " + error.message);
    }
}



// Exports
module.exports = { getTravelRecommendations, getPlacesRecommendations };
