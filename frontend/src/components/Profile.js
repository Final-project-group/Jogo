import { useState, useContext, useEffect } from 'react';
import {Link} from 'react-router-dom'
import TheContext from '../TheContext';
import actions from '../api';
import { useHistory } from 'react-router-dom';


function Profile(props) {
    const { user, setUser } = useContext(TheContext)
    const [userUpdated, setUserUpdated] = useState({})
    const history = useHistory();

    useEffect( () => {
        (async () => {            
            console.log("anything")
            let res = await actions.getUser(props)
            setUserUpdated(res.data)
            console.log(res.data)
          })()
    }, [props])

    const logOut = () => {
        localStorage.removeItem('token')
        setUser(null)
        history.push('/Auth')
    }

    const showSports= () => {
        // console.log(userUpdated.sports[1].name) // WHY THIS DOESN'T WORK??
        
        return userUpdated?.sports?.map((sport) => {
            return sport?.favorite ? <div>{sport?.name}</div> : ""
        })
    }

    console.log(user);

    return (
        <div>
            <h2>Profile {userUpdated.name}</h2>
            <img src={userUpdated.imageUrl} />
            <h2>country: {userUpdated.country}</h2>
            
            <h2>Sports: {showSports()}</h2>
            <Link to='/UserInfo'><button>Edit</button></Link>
            <button onClick={logOut}>Log out</button>
        </div>
    );
}

export default Profile;