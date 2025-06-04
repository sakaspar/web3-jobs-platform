var request = require('request');
var access_token = "AQVntd3ShDCK6WL6CrM9TrKZ_eCWq_TZM5oVj22vZov0pZANOPXR1pN3N4YXjE1c3qpOII4OQCyIC-h0ynrcvw-vXKqqj0o5GfWiGV6bjITPZPfuNzVkZ-wlV4Y-quSjK-mKInT41nPII09AHYn9VetMUoTmadvCkZj6emNvSf6X3HQWIlwdFdWCiviqtx9c6euMMw92b6G6xzr3dB5iZwrCm8ENnWaMPgJdFQJiQLOjDM0qt_KHqyo1dioF-yzdtWdhf3KsihO4HX_8XB7kzHNoDdiNq9UaQ72OH0So0YTG0Jdwj4YanHKEAKhz05K-3Is_8IRzZJ_iEqUqsN7XIP0OaxKKvQ"

// Use OpenID Connect userinfo endpoint instead of deprecated v2 APIs
function getUserInfo(accessToken, done){
    request.get({
        url: "https://api.linkedin.com/v2/userinfo", 
        headers: {"Authorization": "Bearer " + accessToken}
    }, function(err, res, responseBody){
        if (err) {
            console.log(err);
            done(err, null); 
        }
        else {
            console.log("UserInfo Response:", responseBody);
            try {
                done(null, JSON.parse(responseBody)); 
            } catch (parseErr) {
                done(parseErr, null);
            }
        }
    });
}

// Email is included in userinfo response with OpenID Connect
function callEmailAPI(accessToken, done){
    // Email comes from userinfo endpoint now
    getUserInfo(accessToken, done);
}

function main(done){
    getUserInfo(access_token, function(err, userInfo){
        if (err) {
            done(err);
        }
        else {
            try {
                // OpenID Connect userinfo response format
                var firstname = userInfo.given_name || "N/A";
                var lastname = userInfo.family_name || "N/A"; 
                var email = userInfo.email || "N/A";
                
                console.log(firstname + " " + lastname + " " + email);
                done(null, "success");
            } catch (extractErr) {
                console.log("Could not extract user info:", extractErr);
                done(extractErr);
            }
        }
    });
}

main(function(err, result){
    if (err) {
        console.log("Error:", err);
    } else {
        console.log("Result:", result);
    }
});