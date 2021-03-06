import React, {useEffect, useState} from 'react';
import {Error, Head, UserInfo} from '../../../components';
import {Section} from '../../../style';
import ContentsStyles from '../../../components/styles/ContentsStyles';
import DummyContent from "../../../components/DummyContent";
import Content from "../../../components/Content";
import MovieCharts from "../../../components/MovieCharts";
import users from "../../../libs/watcha/users";
import AirbridgeWrapper from "../../../libs/airbridge";
import FilpMove from 'react-flip-move'
import UserCache from "../../../libs/cache";

const Movies = ({query, userData}) => {
    const userID = query.userID.toString();
    const [movies, setMovies] = useState([])
    const [page, setPage] = useState(1);
    const [error, setError] = useState({active: false, type: 200});

    const renderMovies = () => {
        const pageSize = 9
        const pageIndex = page * pageSize
        return movies
            .slice(0, pageIndex)
            .map(({content, user_content_action}) => (
                <li key={content.code.toString()}>
                    <Content
                        code={content.code.toString()}
                        imageUrl={content.poster.large}
                        title={content.title}
                        author={content.director_names.join(', ')}
                        year={content.year.toString()}
                        avg_rating={(content.ratings_avg / 2).toFixed(1)}
                        user_rating={(user_content_action.rating / 2).toFixed(1)}/>
                </li>
            ))
    }

    const getMovies = () => {
        fetch(`/api/users/${userID}/contents/movies`)
            .then(response => {
                if (response.status != 200) {
                    return setError({active: true, type: response.status})
                }
                return response.json()
            })
            .then(json => setMovies(json.result))
            .catch(error => {
                setError({active: true, type: 400})
                console.error(error);
            })

    }

    useEffect(() => {
        getMovies();
        AirbridgeWrapper.getInstance().sendEvent("View", {
            action: "Movies",
            label: userID,
            customAttributes: {userName: userData.name}
        })
    }, []);

    return (
        <main>
            {error && error.active ? (
                <Error error={error}/>
            ) : (
                <>
                    <Head title={`${userData.name ? `Watcha Profile | ${userData.name}` : 'Watcha Profile'}`}
                          url={`https://watcha-profile.songyunseop.com/users/${userID}/movies`}/>
                    {userData && <UserInfo userData={userData}/>}
                    {movies != null && <MovieCharts contentData={movies}/>}
                    {movies != null && movies.length > 0 &&
                    (
                        <Section>
                            <ContentsStyles>
                                <header><h2>Movie</h2></header>
                                <div className="content-list">
                                    <FilpMove typeName={"ul"}>
                                        {renderMovies()}
                                        <DummyContent title={'...more'} onClick={() => {
                                            setPage(page + 1)
                                        }}/>
                                    </FilpMove>
                                </div>
                            </ContentsStyles>
                        </Section>
                    )}
                </>
            )}
        </main>
    );
};


export default Movies;

Movies.getInitialProps = async (props) => {
    const query = props.query
    const userID = props.query.userID.toString();
    const userData = await users(userID).then(res => res.json()).then(json => json.result)
    const userCache = UserCache.getInstance().cache
    userCache.set(userID, userData)
    return {query, userData}
}
