import moment from 'moment';
import 'moment/locale/fr';

import './App.css';
import {useEffect, useState} from "react";
//import tests from "./timings"
//import timings from "./timings-tmv"
//import afup from "./afup"
import logo from "./forum.svg"

function Ftn({number, unit, hideIfZero = true}) {
    if (hideIfZero && !number) {
        return;
    }
    return <span className="ftn">
        {number.toString().padStart(2, "0")}
        <span>{unit}{" "}</span>
    </span>
}

function SelectTrack({tracks, setTrack})  {
    return (
        <div className="select-track">
            <img src={logo} alt="" className="logo"/>
            <div>
                <select onChange={(e) => setTrack(e.target.value)}>
                    <option>Choisissez une track</option>
                    {tracks.map((track, i) => (
                        <option key={i} value={track}>{track}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

function Upcoming({current, timings}) {

    const currentIndex = timings.indexOf(current);
    const nextIndex = (currentIndex + 1) % timings.length;

    return <div className="upcoming">
        {timings.map((timing, i) => {
            const duration = timing.to ? moment.duration(moment(timing.to).diff(timing.from)).minutes() : null;
            const passed = i < nextIndex;
            if (passed) {
                return null;
            }

            return (<div key={i} className={`${passed ? "passed" : ""}`}>
                <div className="datetime">
                    <div className="name">{timing.name}</div>
                    {moment(timing.from).format("HH:mm")}
                    {timing.to ? (moment(timing.to).format(" – HH:mm ")) : null}
                    {duration ? <span>[{duration}min]</span> : null}
                </div>
            </div>)
        })}
    </div>
}

function Current({now, timing}) {
    const [rest, setRest] = useState(moment.duration());
    const [inTalk, setInTalk] = useState(false)
    useEffect(() => {
        if (!timing) {
            return;
        }

        setRest(moment.duration(moment(timing.to ?? timing.from).diff()));
        if (timing.to) {
            setInTalk(moment().isBetween(timing.from, timing.to));
        }

    }, [now, timing]);

    if (!timing) {
        return null;
    }

    if (!rest) {
        return null;
    }

    const duration = timing.to ? moment.duration(moment(timing.to).diff(timing.from)).minutes() : null;
    const color = rest.asMinutes() <= 10 ? rest.asMinutes() <= 5 ? "red" : "orange" : "";

    return <div className="App-next">
        <div className="rest" style={{color: color}}>
            {inTalk && "🗣️ "}
            <Ftn number={rest.days()} unit="j" />
            <Ftn number={rest.hours()} unit="h" />
            <Ftn number={rest.minutes()} unit="min" />
            <Ftn number={rest.seconds()} unit="s" hideIfZero={false} />
        </div>
        <div className="datetime">
            <div className="name">{timing.name}</div>
            {moment(timing.from).format("HH:mm")}
            {timing.to ? (moment(timing.to).format(" – HH:mm ")) : null}
            {duration ? <span>[{duration}min]</span> : null}
        </div>
    </div>
}

function App() {
    const [now, setNow] = useState(moment());
    const [current, setCurrent] = useState();
    const [timings, setTimings] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [track, setTrack] = useState(undefined);

    useEffect(() => {
        fetch("https://afup.org/event/forumphp2025/openfeedback.json")
            .then((response) => {
                response.json()
                    .then((data) => {
                        console.log(data)
                    const timingsFromSessions = Object.values(data)
                        .filter((session) => {
                            return session.trackTitle === track;
                        })
                        .sort((a, b) => moment(a.startTime) > moment(b.startTime))
                        .map((session) => {
                            return {
                                name: session.title,
                                from: session.startTime,
                                to: session.endTime,
                            }
                        });

                    setTimings(timingsFromSessions);
                    //setTimings(tests);

                    const trackFromSessions = Object.values(data)
                        .map((session) => {
                            return session.trackTitle;
                        })
                        .filter((value, index, array) => {
                            return array.indexOf(value) === index
                        })
                        .sort((a, b) => {
                            const [, roomA] = a.split(" - ");
                            const [, roomB] = b.split(" - ");

                            return roomA.localeCompare(roomB);
                        });
                    setTracks(trackFromSessions);
                })
            })
    }, [track]);

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(moment());

            setCurrent(timings.find((timing) => {
                return moment(timing.from).diff(now) >= 0 ||
                    (timing.to && moment(timing.to).diff(now) >= 0);
            }));
        }, 1000);

        return () => {clearInterval(interval)}
    }, [now, timings]);

    return (
        <div className="App">
            <header className="App-header">
                <div className="App-header-now">
                    <div className="date">
                        {now.format("ddd DD MMM YYYY")}
                    </div>

                    <div className="time">
                        {now.format("HH:mm:ss")}
                    </div>
                </div>
            </header>
            <main className="App-main">
                <Current now={now} timing={current} />
                <Upcoming current={current} timings={timings} />
                <SelectTrack tracks={tracks} setTrack={setTrack} />
            </main>
        </div>
    );
}

export default App;
