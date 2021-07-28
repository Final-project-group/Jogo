import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import actions from "../api";
import TheContext from "../TheContext";
import { Link } from "react-router-dom";
import { Map, InfoWindow, Marker, GoogleApiWrapper } from "google-maps-react";
import NodeGeocoder from "node-geocoder";
import { useHistory } from "react-router-dom";
import Button from "@material-ui/core/Button";
import Icon from "@material-ui/core/Icon";
import { AccessAlarm, ThreeDRotation } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";

const JOSE_API_KEY = process.env.REACT_APP_API_KEY;
const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
    display: "flex",
  },
  button: {
    margin: theme.spacing(1),
  },
}));

function EventDetails(props) {
  const classes = useStyles();

  // const defaultLocation = {  lat: 25.7617, lng: 80.1918  };
  const [userPosition, setUserPosition] = useState(""); // user coordinates (from browser location)
  const [eventPosition, setEventPosition] = useState(""); // event coordinates (from geocode API call)
  const [details, setDetails] = useState({}); // event info from database, store here
  const { user } = useContext(TheContext); // user from App.js
  const [showingInfoWindow, setShowingInfoWindow] = useState(false);
  const [activeMarker, setActiveMarker] = useState({});
  const [selectedPlace, setSelectedPlace] = useState({});
  const [commentSection, setCommentSection] = useState([]); //DELETE ONCE POST FEATURE IS IMPLEMENTED
  const [allPosts, setAllPosts] = useState([]);

  const onMarkerClick = (props, marker, e) => {
    setSelectedPlace(props);
    setActiveMarker(marker);
    setShowingInfoWindow(true);
  };

  useEffect(() => {
    (async () => {
      let res = await actions.getDetail(props); //get event info from database
      console.log(res.data);
      console.log(user);
      setDetails(res.data);
      getGeocode(res.data);
      // console.log(address)
    })();

    (async () => {
      let res = await actions.getAllPosts();
      console.log(res);
      setAllPosts(res.data);
    })();

    navigator.geolocation.getCurrentPosition(function (position) {
      console.log("User Latitude is :", position.coords.latitude);
      console.log("User Longitude is :", position.coords.longitude);
      setUserPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });
  }, [props, user]);

  // Convert event address to coordinates using Google geocode API
  const getGeocode = async (details) => {
    let convert = details?.location;
    // console.log(details?.location);
    // console.log(typeof details?.location);
    // Convert from spaces to + signs:
    // console.log(convert);
    convert = convert
      ?.split("")
      ?.map((char) => (char === " " ? "+" : char))
      .join("");
    // console.log(convert);
    // setAddress(convert)
    let ras = await axios.get(
      // `https://maps.googleapis.com/maps/api/geocode/json?address=29+champs+elys%C3%A9e+paris&key=AIzaSyAf6-uRnVV8NM67T9FobkbcynWfDGe-0oY`
      `https://maps.googleapis.com/maps/api/geocode/json?address=${convert}&key=${JOSE_API_KEY}`
    );
    console.log(ras.data);
    setEventPosition(
      ras.data.results.length === 0
        ? alert(
            "Can not read address. Change and do not forget the state and country"
          )
        : ras.data.results[0].geometry.location
    );
    console.log("Event coordinates: ", ras.data.results[0].geometry.location);
  };

  // console.log(process.env);
  // console.log(props.match.params.dynamicId);
  const memberJoin = () => {
    console.log(details.members);
    if (details?.members?.length < details?.spots) {
      //console.log(!details.members?.includes( user))
      let doesUserExist = false;
      details?.members.map((eachMember) => {
        if (eachMember._id === user._id) {
          doesUserExist = true;
          return;
        }
      });
      if (!doesUserExist) {
        let copy = { ...details };
        //console.log(user);
        // console.log(user._id);
        copy.members.push(user);
        copy.memberIds.push(user._id);
        // console.log(copy.members);

        setDetails(copy);

        console.log(copy.memberIds);
        // console.log(details);
        actions.joinEvent(copy);
      } else {
        alert("you already joined dummy!");
      }
    } else {
      alert("party is full!");
    }
  };
  //console.log(details?.members?.map((each) => each._id === user._id).includes(true));

  const leave = () => {
    let copy = { ...details };
    //console.log(user);
    // console.log(user._id);
    for (var i = 0; i < copy.members.length; i++) {
      if (copy.members[i]._id === user._id) {
        console.log("hahahahah");
        copy.members.splice(i, 1);
        copy.memberIds.splice(i, 1);
      }
    }
    // console.log(copy.members);
    // console.log(user);
    // console.log(copy.members);

    setDetails(copy);

    // console.log(details);
    actions.leaveEvent(copy);

    console.log(details);
    // actions.joinEvent(copy);
  };

  function AddPost(props) {
    let [post, setPost] = useState("");
    let [eventId, setEventId] = useState("");
    let history = useHistory();

    const handleChange = (e) => {
      setPost(e.target.value);
      setEventId(details?._id);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      console.log(post);
      let res = await actions.addPost({ post, eventId });
      setPost("");
      history.push(`/eventDetails/${details?._id}`); //props.history.push is also an option
    };

    return (
      <div>
        <h3>Add Comment</h3>
        <form onSubmit={handleSubmit}>
          <div className="commentBox">
            <TextField
              onChange={handleChange}
              value={post}
              placeholder="Enter a post"
              id="filled-basic"
              label="Filled"
              variant="filled"
            />
            <Button
              // size="small"
              variant="contained"
              color="primary"
              type="submit"
            >
              Send
            </Button>
          </div>
        </form>
        <br />
      </div>
    );
  }

  //ONLY FOR REFERENCE, DELETE ONCE POST FEATURE IS IMPLEMENTED!
  const showCommentSection = () => {
    return commentSection.map((eachComment) => {
      // console.log(anime.mal_id);
      // console.log(eachComment.animeId);
      if (
        eachComment?.animeId === props.match.params.dynamicId &&
        eachComment?.type === "comments"
      ) {
        return (
          <div style={{ background: "white", margin: "10px" }}>
            <h3>{eachComment?.user}</h3>
            <p>{eachComment?.comment}</p>
          </div>
        );
      }
    });
  };

  const ShowPosts = () => {
    return allPosts.map((eachPost) => {
      const deletePost = async () => {
        actions.deletePost(eachPost);
        // eslint-disable-next-line no-restricted-globals
        props.history.push(`/eventDetails/${details?._id}`);

        // let res = await actions.getAllPosts();
        // setAllPosts(res.data);
      };
      if (eachPost.eventId === details?._id) {
        console.log(eachPost.userId._id);
        console.log(user._id);
        return (
          <li key={eachPost._id}>
            <i>{eachPost.userId?.name}: </i> {eachPost.post}{" "}
            {eachPost.userId._id === user?._id ? (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={deletePost}
              >
                Delete
              </Button>
            ) : null}
          </li>
        );
      }
    });
  };

  const showEvent = (props) => {
    return (
      <div>
        <img src={details?.image}></img>
        {/* <div className="materialList">
          
          <List
            component="nav"
            className={classes.root}
            aria-label="mailbox folders"
          >
            <ListItem button>
              <ListItemText primary="Inbox" />
            </ListItem>
            <Divider />
            <ListItem button divider>
              <ListItemText primary="Drafts" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Trash" />
            </ListItem>
            <Divider light />
            <ListItem button>
              <ListItemText primary="Spam" />
            </ListItem>
          </List>
        </div> */}

        <h3>{details?.eventName}</h3>
        <div className="detailsText">
          <p>Sport: {details?.sport}</p>
          <p>Address: {details?.location}</p>
          {console.log(details?.location)}
          <p>Date & time: {details?.date}</p>
          <p>Ages: {details?.age}</p>
          <p>Level: {details?.level}</p>
          <p>
            {`Total: ${details?.spots} / Available: ${
              details?.spots - details?.members?.length
            }`}
          </p>
          <ul>
            Members:
            {details?.members?.map((member) => {
              return (
                <li key={member._id}>
                  <h5>{member.name}</h5>
                </li>
              );
            })}
          </ul>
          <p>Description: {details?.description}</p>
        </div>
        {user._id === details?.creator?._id ? (
          <Link to={`/editEvent/${details?._id}`}>
            {" "}
            <button> Edit </button>{" "}
          </Link>
        ) : details?.members
            ?.map((each) => each._id === user._id)
            .includes(true) ? (
          <Button variant="contained" color="primary" onClick={leave}>
            Leave Event
          </Button>
        ) : (
          <Button variant="contained" color="primary" onClick={memberJoin}>
            Join Event
          </Button>
        )}
        <br />
        <br />
      </div>
    );
  };

  return (
    <div>
      {/* <h1>EVENT DETAILS</h1> */}
      {showEvent()}
      {AddPost()}
      {/* <div>{showCommentSection()}</div> */}
      <ShowPosts />

      <br />

      <Map
        google={props.google}
        zoom={13}
        zoomControl={true}
        center={eventPosition}
        scrollwheel={false}
      >
        <Marker
          onClick={onMarkerClick}
          name={"User location"}
          position={userPosition}
          streetViewControl={true}
        />
        <Marker
          onClick={onMarkerClick}
          name={"Event location"}
          position={eventPosition}
          streetViewControl={true}
        />
        <InfoWindow marker={activeMarker} visible={showingInfoWindow}>
          <div>
            <h3>
              {activeMarker.name === "Event location"
                ? details?.location
                : "Your location"}
            </h3>
          </div>
        </InfoWindow>
      </Map>
    </div>
  );
}

export default GoogleApiWrapper({
  apiKey: JOSE_API_KEY,
})(EventDetails);
