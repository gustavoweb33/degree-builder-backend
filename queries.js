

export const subjectQuery = 'SELECT course_subject_id AS subjectId, course_subject_prefix AS subject, course_subject_description AS description FROM course_subject';

export const departmenDegreeConcentrationJoin = 'SELECT department.department_id AS departmentId, department_name AS departmentName, college_id AS collegeID, degree.degree_id AS degreeId, degree.degree_name AS degreeName, degree.department_id AS departmentId, concentration.concentration_id AS concentrationId, concentration.concentration_description AS concentrationDescription FROM department INNER JOIN degree ON department.department_id = degree.department_id INNER JOIN concentration ON degree.degree_id = concentration.degree_id';
 
