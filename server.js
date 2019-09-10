import express from 'express';
import bodyParser from 'body-parser';
import connection from './connection';
const app = express();
import { subjectQuery, departmenDegreeConcentrationJoin } from './queries';

app.use( bodyParser.urlencoded( { extended: false } ) );

//tells browsers to allow requesting code from any origin to access the resource. 
app.use( function ( req, res, next ) {
    res.header( "Access-Control-Allow-Origin", "*" );
    res.header( "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept" );
    next();
} );

//database username and password is imported from 'connection' file
connection.connect( ( error ) => {
    if ( error ) {
        console.log( 'error' )
    }
} );


app.get( '/subjects', ( req, res ) => {
    connection.query( subjectQuery, ( error, results ) => {
       
        if ( error ) throw error;
        let subjectData = JSON.stringify( results );
        subjectData = JSON.parse( subjectData );
        return res.send( subjectData );
    } );
} );


app.get( '/degrees', ( req, res ) => {
    connection.query( departmenDegreeConcentrationJoin, ( error, results ) => {
        if ( error ) throw error;

        let data = JSON.stringify( results );
        data = JSON.parse( data );
        return res.send( data );
    } );
} );


app.get( '/saved', ( req, res ) => {
    const { name } = req.query;

    if ( name === 0 ) {
        return;
    }

    const query = `SELECT concentration_id AS concentrationId, course_id AS courseId, requirement_type_id AS requirementTypeId, semester, credit_hour AS creditHours FROM graduation_requirement WHERE concentration_id=${ name }`

    connection.query( query, ( error, results ) => {
        let data = JSON.stringify( results );
        data = JSON.parse( data );
        res.send( data );
    } );
} );


app.get( '/courses', ( req, res ) => {
    const { id } = req.query;
    const query = `SELECT course_id AS courseId, course_subject_id AS courseSubjectId, credit_hours AS creditHours
    FROM course WHERE course_subject_id =${id }`

    connection.query( query, ( error, results ) => {
        let data = JSON.stringify( results );
        data = JSON.parse( data );
        res.send( data )
    } )
} );


app.get( '/insert', ( req, res ) => {
    const { course } = req.query;
    const graduationRequirements = JSON.parse( course );
    const courses = graduationRequirements.course;
    const concentrationId = Number( graduationRequirements.concentration );



    //remove any double courses
    const coursesToBeSaved = [];
    const map = new Map();
    for ( const item of courses ) {
        if ( !map.has( item.courseId ) ) {
            map.set( item.courseId, true );    // set any value to Map
            coursesToBeSaved.push( {
                courseId: item.courseId,
                courseSubjectId: item.courseSubjectId,
                creditHours: item.creditHours
            } ); 
        }
    }

    connection.query( `
    SELECT concentration_id, course_id, requirement_type_id, semester, credit_hour 
    FROM graduation_requirement
    WHERE concentration_id = ${concentrationId }`,
        ( error, results ) => {
            let data = JSON.stringify( results );
            data = JSON.parse( data );
 
            const alreadySavedCourses = data.map( course => course.course_id );

            //extract only coursesId to be compared to already saved courses in the database
            const coursesToBeSavedId = coursesToBeSaved.map( course => course.courseId )

            //check if the coursesToBeSaved has duplicates 
            const duplicates = coursesToBeSavedId.some( id => alreadySavedCourses.includes( id ) );

            if ( duplicates ) {
               
                const duplicateLocations = alreadySavedCourses.map( id => coursesToBeSavedId.indexOf( id ) );
                duplicateLocations.sort( ( a, b ) => a - b );
                console.log(alreadySavedCourses, duplicateLocations)
 

                for ( let i = duplicateLocations.length - 1; i >= 0; i-- ) {
                    //anything greater than -1 is a location of a duplicate course
                    //duplicates are removed
                    if ( duplicateLocations[ i ] > -1 ) {
                        coursesToBeSaved.splice( [ duplicateLocations[ i ] ], 1 );
                    }
                }
            }


            for ( let i = 0; i < coursesToBeSaved.length; i++ ) {
                connection.query( `
            INSERT INTO graduation_requirement (concentration_id, course_id, requirement_type_id, semester, credit_hour)
            VALUES(${concentrationId }, '${ coursesToBeSaved[ i ].courseId }', 
            2, 0, ${ coursesToBeSaved[ i ].creditHours })`,
                    ( error, results ) => {

                        if ( error ) throw error;
                        console.log( 'insert complete' );

                    } );
            }
            res.send( { duplicateCourses: [] } );
        } );
} );

app.get( '/delete', ( req, res ) => {
    let { deleteCourse } = req.query;
    deleteCourse = JSON.parse( deleteCourse );

    const query = `DELETE from graduation_requirement where concentration_id = ${ deleteCourse.CONCENTRATION_ID }
     and course_id = '${deleteCourse.courseId }'`;

    connection.query( query, ( error, results ) => {
        if ( error ) throw error;
        else console.log( `concentration: ${ deleteCourse.CONCENTRATION_ID }, course: ${ deleteCourse.courseId } has been deleted` );
    } );
    res.send( { message: 'deleted a course' } )
} );


app.get( '/deleteAllCourses', ( req, res ) => {
    let { id } = req.query;
    const query = `DELETE FROM graduation_requirement WHERE concentration_id = ${ id }`;
    connection.query( query, ( error, results ) => {
        if ( error ) throw error;
        else console.log( 'Graduation requirements from the concentration has been deleted' );
    } )
} );


app.listen( 4000, () => {
    console.log( 'listening on port 4000' );
} );

