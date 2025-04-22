import express from "express";
import axios from "axios";
import cors from "cors";
import bodyParser from "body-parser";
import { getISOByParam } from "iso-country-currency";
const app = express();
const port = 3000;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.render("form.ejs")
});

app.post("/weather", async (req, res) => {
    try {
        console.log(req.body) // { country: 'UAE', city: 'Dubai' }
        function Capitalize(word) {
        let countryArray = word.split(" ")
        let capitalized = countryArray.map((item) => item[0].toUpperCase() + item.slice(1,));
        return capitalized.join(" ")
        }
        let ISO2 = getISOByParam('countryName', Capitalize(req.body.country));
        console.log(ISO2) ;
        const response = await axios.get(`https://api.api-ninjas.com/v1/geocoding?city=${Capitalize(req.body.city)}&country=${ISO2}`, {
            headers: {
                "X-Api-Key" : "Your-ninja-api-key",
                "Accept": "application/json",
            }
        });
        // gives latitudes and longitudes
        let lat = response.data[0].latitude.toFixed(4)
        let log = response.data[0].longitude.toFixed(4)
        try {
            // get the JSON data forecast based on location
            const result = await axios.get(`https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat}&lon=${log}`, {
                headers: {
                'User-Agent': 'LocalWeatherApp/1.0 fsa463@student.bham.ac.uk',
                'Accept': 'application/json',
                },
            })
            const timeseries = result.data.properties.timeseries;
              // create next day variable
              let dateConstructor = new Date();
              let nextDay = new Date();
              nextDay.setDate(dateConstructor.getDate() + 1); // sets a new date
              let ISO = nextDay.toISOString();
              nextDay = ISO.split("T")[0];
              // filter timeseries array to get the weather forecasting for the nextday
              let arr = timeseries.filter((obj) => {
                return obj.time.split("T")[0] === nextDay
            });
            // store all the necessary values in variables for the next day at specific time intervals
            function createData(object, arraySection, time) {
                object["symbol_code_1hour"] = arraySection.data.next_1_hours.summary.symbol_code;
                object["relativeHumidity"] = arraySection.data.instant.details.relative_humidity;
                object["airPressureAtSeaLevel"] = arraySection.data.instant.details.air_pressure_at_sea_level;
                object["windSpeed"]= arraySection.data.instant.details.wind_speed;
                object["airTemperature"] = arraySection.data.instant.details.air_temperature
                object["time"] = time
                return object
            };
            let midnight = createData({}, arr[0], "midnight");
            let afternoon = createData({}, arr[15], "afternoon" );
            let evening = createData({}, arr[18], "evening");
            let night = createData({}, arr[21], "night");
            let noon = createData({}, arr[12], "noon");
            // render the webpage for the next day
            res.render("index.ejs", {content: [midnight, afternoon, evening, night, noon]})
    
        }
        catch (error) {
            console.log(error.message)
        }

    }
    catch (error) {
        console.log(error.message)
    }})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
