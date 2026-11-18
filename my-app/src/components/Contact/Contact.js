"use client";

import { useState } from "react";
import styles from "./Contact.module.css";

export default function Contact(){

const [form,setForm] = useState({
name:"",
email:"",
phone:"",
subject:"",
message:""
});

const [success,setSuccess] = useState(false);

const handleChange = (e)=>{
setForm({
...form,
[e.target.name]: e.target.value
});
};


const handleSubmit = async (e)=>{
e.preventDefault();

if(!form.name || !form.email || !form.subject || !form.message){
alert("Please fill required fields");
return;
}

try{

const res = await fetch("/api/contact",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body: JSON.stringify(form)

});

const data = await res.json();

if(data.success){

setSuccess(true);

setForm({
name:"",
email:"",
phone:"",
subject:"",
message:""
});

}
else{

alert("Mail not sent");

}

}
catch(error){

console.log(error);

alert("Server error");

}

};



return(

<section className={styles.container}>

<div className={styles.card}>

<h2 className={styles.title}>
Contact Us
</h2>

<p className={styles.subtitle}>
For product enquiry, support, partnership 🌱
</p>


{success && (

<p className={styles.success}>
Message sent successfully ✔
</p>

)}


<form
className={styles.form}
onSubmit={handleSubmit}
>


<div className={styles.row}>

<input
className={styles.input}
name="name"
placeholder="Full Name *"
value={form.name}
onChange={handleChange}
/>


<input
className={styles.input}
name="email"
placeholder="Email *"
value={form.email}
onChange={handleChange}
/>

</div>



<div className={styles.row}>

<input
className={styles.input}
name="phone"
placeholder="Phone"
value={form.phone}
onChange={handleChange}
/>


<input
className={styles.input}
name="subject"
placeholder="Subject *"
value={form.subject}
onChange={handleChange}
/>

</div>



<textarea
className={styles.textarea}
name="message"
placeholder="Write message *"
rows="5"
value={form.message}
onChange={handleChange}
/>



<button
className={styles.button}
type="submit"
>
Send Message
</button>


</form>


</div>

</section>

);

}