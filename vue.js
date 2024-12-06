   
            let app = new Vue ({
                el: '#app',
                data: {
                    hostLink: "https://cst3144cw1.onrender.com",
                    sortSetting: 0,
                    sortOrder: 1,
                    showProduct: true,
                    sitename: "After School Club",
                    cart: [],
                    Query: "",
                    SearchedClubs: [],
                    emptySearch: false,
                    clubs: [],
                    order: {
                        firstName: '',
                        lastName: '',
                        phone: '',
                        emirate: '',
                        LessonIDs: []
                    },
                    emirates: {
                        Du: 'Dubai',
                        Ad: 'Abu Dhabi',
                        Sh: 'Sharjah',
                        Aj: 'Ajman'
                    }
                },

                async created(){
                    this.clubs =  await fetch(`${this.hostLink}/collection/Lessons`, {method: 'GET'})
                    .then(response => response.json())
                    .then(responseJSON => {return responseJSON})
                    .catch((error) => {console.log(error);});
                },

                methods: {
                    addCart: function(club) {
                        this.cart.push(club._id);
                        club.availableSlots --;
                    },
                    showCheckout: function(){
                        this.showProduct = this.showProduct ? false:true;
                    },
                    submitForm: function() {
                        let Cart = this.cart.slice(0);
                        let uniqueCart = [];
                        let LessonCount = [];
                        Cart.forEach(i =>{
                            if(uniqueCart.indexOf(i) == -1 ){
                                uniqueCart.push(i);
                                let currentClub = this.clubs.find(x => {return x._id == i});
                                let dummy= {
                                    "_id": i,
                                    "subject": currentClub.subject,
                                    "count": 1
                                }
                                LessonCount.push(dummy);
                            }
                            else{
                                LessonCount.forEach(j =>{
                                    if(j._id === i){
                                        j.count++
                                    }
                                })
                            }
                        });
                        this.order.LessonIDs = LessonCount;
                        
                        fetch(`${this.hostLink}/collection/Orders`, {
                            method: 'POST', // set the HTTP method as 'POST'
                            headers: {
                                'Content-Type': 'application/json', // set the data type as JSON
                            },
                            body: JSON.stringify(this.order), // need to stringify the JSON object
                        });
                        
                        this.order.LessonIDs.forEach(async i =>{
                            let current = await fetch(`${this.hostLink}/collection/Lessons/${i._id}`, {method: 'GET'})
                            .then(response => response.json())
                            .then(responseJSON => {return responseJSON})
                            .catch((error) => {console.log(error);});

                            let dummy = {availableSlots: current.availableSlots - i.count}
                            
                            fetch(`${this.hostLink}/collection/Lessons/${i._id}`, {
                                method: 'PUT', // set the HTTP method as 'POST'
                                headers: {
                                    'Content-Type': 'application/json', // set the data type as JSON
                                },
                                body: JSON.stringify(dummy), // need to stringify the JSON object
                            });
                        });
                        
                        alert('Order Placed');

                        this.cart = [];
                        this.showCheckout();
                    },

                    canAddToCart: function(club){
                        return club.availableSlots > 0;
                    },

                    removeFromCart: function(event,club){
                        const item = event.target;
                        let removeBy = parseInt(item.parentNode.firstChild.value);
                        if(!isNaN(removeBy)){
                            for(let i = 0;i<removeBy;i++){
                                let toRemove = this.cart.indexOf(club._id);
                                let pap = this.cart.splice(toRemove, 1);
                                console.log(typeof(pap[0]));
                            }
                            club.availableSlots = club.availableSlots + removeBy;
                            item.parentNode.firstChild.value = "";
                        }
                    },
                    findQuery: async function(){
                        let empt = /\S/;
                        if(empt.test(this.Query)){
                            let foundArray =  await fetch(`${this.hostLink}/search/Lessons/${this.Query}`, {method: 'GET'})
                            .then(response => response.json())
                            .then(responseJSON => {return responseJSON})
                            .catch((error) => {console.log(error);});
                            this.SearchedClubs = foundArray;
                        }
                        else {this.SearchedClubs = [];}
                    },
                    setMax: function(event, club) {
                        const item = event.target;
                        item.setAttribute("max",club.count);
                        if(item.value>club.count){
                            item.parentNode.children[1].setAttribute("disabled","disabled");
                            item.parentNode.children[2].innerText = "You are trying to remove too much";
                        }
                        else{
                            item.parentNode.children[1].removeAttribute("disabled");
                            item.parentNode.children[2].innerText = "";
                        }
                    }

                },

                computed:{
                    cartItemCount: function(){
                        return this.cart.length || "";
                    },
                    sortedClubs: function() {
                        let clubsArray = [];
                        let empt = /\S/
                        if(empt.test(this.Query)){
                            clubsArray = this.SearchedClubs.slice(0);
                            if(clubsArray.length == 0){this.emptySearch = true}
                            else this.emptySearch = false;
                        }
                        else {
                            clubsArray = this.clubs.slice(0);
                            this.emptySearch = false;
                        }
                        let sort = this.sortOrder
                        if(this.sortSetting == 1) {
                            function compare(a,b) { 
                                if (a.location > b.location)
                                    return sort;
                                if (a.location < b.location)
                                    return -sort;
                                return 0;
                            }
                        }
                        else if(this.sortSetting == 2) {
                            function compare(a,b) { 
                                if (a.price > b.price)
                                    return sort;
                                if (a.price < b.price)
                                    return -sort;
                                return 0;
                            }
                        }
                        else if(this.sortSetting == 3) {
                            function compare(a,b) { 
                                if (a.availableSlots > b.availableSlots)
                                    return sort;
                                if (a.availableSlots < b.availableSlots)
                                    return -sort;
                                return 0;
                            }
                        }
                        else{
                            function compare(a,b) { 
                                if (a.subject > b.subject)
                                    return sort;
                                if (a.subject < b.subject)
                                    return -sort;
                                return 0;
                            }
                        }
                        return clubsArray.sort(compare); 
                    },
                    cartDisplay: function(){
                        //create seperate list of lessons
                        let clubsArray = this.clubs.slice(0);

                        //adding a count property to each lesson object to count each time it appears in the cart
                        clubsArray.forEach(item => {item.count = 0;});
                        
                        // Count occurrences in the cart
                        for (let i of this.cart) {
                            let j = clubsArray.find(item => item._id == i);
                            if (j != undefined) {j.count++;}
                        }

                        // Filter clubs that are in the cart
                        return clubsArray.filter(j => j.count > 0);
                    },
                    valueCheck: function(){
                        let names = /^[a-z]+$/i
                        let numbers = /^[0-9]+$/
                        let empt = /\S/
                        testValue = names.test(this.order.firstName) && names.test(this.order.lastName) && numbers.test(this.order.phone)
                        emptyTest = empt.test(this.order.firstName) && empt.test(this.order.lastName) && empt.test(this.order.phone) && empt.test(this.order.emirate)
                        return testValue && emptyTest
                    }                     

                }

            });
